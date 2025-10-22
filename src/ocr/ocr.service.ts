import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
import { AzureOpenAI } from 'openai';
import { Express } from 'express';
import { GetOcrRecordsDto, OcrRecordDto } from './dto/GetOcrRecordsDto';
import { UtilsService } from 'src/common/utils/utils.service';
import { AWSS3Service } from 'src/common/aws-s3/aws-s3.service';
import { Worker, createWorker } from 'tesseract.js';
import { TranslateService } from 'src/translate/translate.service';
import { BedrockService } from 'src/bedrock/bedrock.service';
import { AskQuestionDto } from './dto/ask-question.dto';

@Injectable()
export class OcrService {
    private logger = new Logger();
    private worker: Worker | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly utilsService: UtilsService,
        private readonly translateService: TranslateService,
        private readonly bedrockService: BedrockService,
    ) { }

    private async init() {
        this.worker = await createWorker('kor')
    }

    //ocr - tesseract
    async ocr(userId: number, files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException({
                message: ['이미지 파일이 없습니다.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }
        const uploadFile = await this.utilsService.imageUpload(userId, files[0]);
        const imageUrl = uploadFile.imageUrl;

        if (!this.worker) await this.init();
        if (!this.worker) {
            throw new BadRequestException({
                message: ['OCR 엔진이 초기화되지 않았습니다.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        const user = await this.prisma.users.findUnique({
            where: {
                id: userId,
            },
            select: {
                targetLanguage: true,
            }
        })
        if (!user) {
            throw new UnauthorizedException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            })
        }

        const { data } = await this.worker.recognize(imageUrl);

        const originalText = data.text.trim();
        const ocrResults = originalText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

        const translateResults: string[] = [];
        for (const line of ocrResults) {
            try {
                const translated = await this.translateService.translate(
                    line,
                    'auto',
                    user.targetLanguage
                );
                translateResults.push(translated.trim());
            } catch (err) {
                console.error(`❌ 번역 실패 (${line}):`, err);
                translateResults.push(''); // 실패한 경우 빈 문자열
            }
        }

        console.log('OCR 원문:', ocrResults);
        console.log('번역 결과:', translateResults);

        await this.prisma.translations.create({
            data: {
                originalText: ocrResults,
                menteeId: userId,
                translatedText: translateResults,
                keyConcept: '',
                solution: '',
                summary: '',
                createdAt: new Date(),
            }
        })

        return {
            message: 'OCR 요청 성공',
            statusCode: 200,
            originalText: ocrResults,
            translatedText: translateResults,
        }
    }

    private async onModuleDestroy() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }

    async solution(userId: number) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId, isDeleted: false },
                select: { targetLanguage: true },
            });

            if (!user) {
                throw new UnauthorizedException({
                    message: ['사용자를 찾을 수 없습니다.'],
                    error: 'Unauthorized',
                    statusCode: 401,
                });
            }

            const requestUser = await this.prisma.translations.findFirst({
                where: { menteeId: userId },
                orderBy: { id: 'desc' },
                select: { originalText: true },
            });

            if (!requestUser) {
                throw new NotFoundException({
                    message: ['문제를 찾을 수 없습니다.'],
                    error: 'NotFound',
                    statusCode: 404,
                });
            }

            const targetLanguage = user.targetLanguage;
            const problem: string[] = requestUser.originalText;

            // 민감 단어 필터링
            const sanitizeText = (text: string[]) =>
                text.map(line =>
                    line
                        .replace(/제모/g, '모발 제거')
                        .replace(/hair removal/g, '모발 제거')
                        .replace(/removal/g, '제거')
                        .replace(/정벌/g, '정복')
                        .replace(/대결/g, '대립')
                        .replace(/conquest/g, '정복')
                        .replace(/혁명/g, '개혁')
                        .replace(/독립/g, '자립')
                        .replace(/반대/g, '거부')
                        .replace(/revolution/g, '개혁')
                        .replace(/independence/g, '자립')
                        .replace(/반일/g, '대외 관계')
                        .replace(/민족/g, '국민')
                        .replace(/통합/g, '연합'),
                );

            const sanitizedProblem = sanitizeText(problem);

            const questionPrompt = `
                You are a helpful assistant for elementary school students who need problem explanations translated into ${targetLanguage}.
                Please describe the problem in a way that is easy to understand.

                Problem:
                ${sanitizedProblem.join('\n')}

                Respond ONLY in JSON format:
                {
                "solution": "detailed explanation here",
                "keyConcept": "keyword1, keyword2, keyword3",
                "summary": "brief summary here"
                }

                IMPORTANT for keyConcept:
                - Extract ONLY the core concept keywords (2-5 words maximum)
                - Use comma-separated single words or short phrases
                - Examples: "분수, 약분", "삼각형, 넓이, 공식", "multiplication, division"
                - DO NOT write full sentences
                - Focus on the mathematical or subject-specific terms only
            `;

            const bedrockResponseText = await this.bedrockService.generateText(questionPrompt);
            this.logger.debug('Bedrock 응답:', bedrockResponseText);

            let gptResponse;
            try {
                gptResponse = JSON.parse(bedrockResponseText);
            } catch {
                gptResponse = {
                    solution: bedrockResponseText,
                    keyConcept: '',
                    summary: '',
                };
            }

            const translationRecord = await this.prisma.translations.findFirst({
                where: { menteeId: userId },
                orderBy: { id: 'desc' },
            });

            if (!translationRecord) {
                throw new NotFoundException({
                    message: ['번역 레코드를 찾을 수 없습니다.'],
                    error: 'NotFound',
                    statusCode: 404,
                });
            }

            await this.prisma.translations.update({
                where: { id: translationRecord.id },
                data: {
                    keyConcept: gptResponse.keyConcept,
                    solution: gptResponse.solution,
                    summary: gptResponse.summary,
                },
            });

            return {
                message: 'Solution 요청 성공',
                statusCode: 200,
                keyConcept: gptResponse.keyConcept,
                solution: gptResponse.solution,
                summary: gptResponse.summary,
            };
        } catch (error) {
            this.logger.error('Solution 요청 실패:', error);
            throw new BadRequestException({
                message: ['Solution 요청 실패'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }
    }

    async askQuestion(userId: number, askQuestionDto: AskQuestionDto) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId, isDeleted: false },
                select: { targetLanguage: true },
            });

            if (!user) {
                throw new UnauthorizedException({
                    message: ['사용자를 찾을 수 없습니다.'],
                    error: 'Unauthorized',
                    statusCode: 401,
                });
            }

            const targetLanguage = user.targetLanguage;
            const { question } = askQuestionDto;

            // 민감 단어 필터링
            const sanitizeText = (text: string) =>
                text
                    .replace(/제모/g, '모발 제거')
                    .replace(/hair removal/g, '모발 제거')
                    .replace(/removal/g, '제거')
                    .replace(/정벌/g, '정복')
                    .replace(/대결/g, '대립')
                    .replace(/conquest/g, '정복')
                    .replace(/혁명/g, '개혁')
                    .replace(/독립/g, '자립')
                    .replace(/반대/g, '거부')
                    .replace(/revolution/g, '개혁')
                    .replace(/independence/g, '자립')
                    .replace(/반일/g, '대외 관계')
                    .replace(/민족/g, '국민')
                    .replace(/통합/g, '연합');

            const sanitizedQuestion = sanitizeText(question);

            const questionPrompt = `
                You are a kind and patient elementary school teacher having a conversation with a student in ${targetLanguage}.
                The student has a question about something they're learning.

                Student's Question:
                "${sanitizedQuestion}"

                Please respond naturally as a teacher would in a conversation:
                - Answer the question directly and warmly
                - Use simple, conversational language suitable for elementary students
                - Include easy-to-understand examples if helpful
                - Encourage the student and make them feel confident
                - Keep it brief and focused (2-5 sentences)
                - Respond entirely in ${targetLanguage}

                Provide your answer as plain text, NOT in JSON format. Just write your natural teacher response.
            `;

            const bedrockResponseText = await this.bedrockService.generateText(questionPrompt);

            await this.prisma.aIQuestions.create({
                data: {
                    menteeId: userId,
                    question: sanitizedQuestion,
                    answer: bedrockResponseText.trim(),
                },
            });

            return {
                message: '질문 답변 성공',
                statusCode: 200,
                answer: bedrockResponseText.trim(),
            };
        } catch (error) {
            this.logger.error('질문 처리 실패:', error);
            throw new BadRequestException({
                message: ['질문 처리 실패'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }
    }

    async getMyOcr(userId: number): Promise<OcrRecordDto[]> {
        const ocrRecords = await this.prisma.translations.findMany({
            where: {
                menteeId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                userName: true,
                userEmail: true,
            }
        })
        if (!user) {
            throw new UnauthorizedException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'Unauthorized',
                statusCode: 401
            })
        }

        return ocrRecords.map((record) => ({
            id: record.id,
            originalText: record.originalText,
            translatedText: record.translatedText,
            createdAt: record.createdAt,
            keyConcept: record.keyConcept,
            solution: record.solution,
            summary: record.summary,
            user: {
                id: user.id,
                user_name: user.userName,
                user_email: user.userEmail,
            }
        }))
    }
}