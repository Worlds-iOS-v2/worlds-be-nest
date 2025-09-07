import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
import { AzureOpenAI } from 'openai';
import { Express } from 'express';
import { GetOcrRecordsDto, OcrRecordDto } from './dto/GetOcrRecordsDto';

@Injectable()
export class OcrService {
    private client: AzureOpenAI;
    private logger = new Logger();

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService
    ) {
        const endpoint = this.configService.get('OPEN_AI_ENDPOINT');
        const apiKey = this.configService.get('OPEN_AI_API_KEY');
        const deployment = this.configService.get('OPEN_AI_DEPLOYMENT');
        const apiVersion = '2025-01-01-preview';

        this.client = new AzureOpenAI({
            endpoint,
            apiKey,
            apiVersion,
            deployment
        });
    }

    // 기존 OCR
    async ocr(userId: number, files: Express.Multer.File[]) {
        const azureApiKey = this.configService.get('AI_SERVICES_API_KEY');
        const ocrEndPoint = this.configService.get('OCR_ENDPOINT');
        const translateEndPoint = this.configService.get('TRANSLATE_ENDPOINT');
        const openAiEndpoint = this.configService.get('OPEN_AI_ENDPOINT');
        const openAiApiKey = this.configService.get('OPEN_AI_API_KEY');

        if (!azureApiKey || !ocrEndPoint || !translateEndPoint || !openAiEndpoint || !openAiApiKey) {
            throw new BadRequestException({
                message: ['API 키 또는 엔드포인트가 설정되지 않았습니다. 환경 변수를 확인해주세요.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        let ocrResults: string[] = [];

        if (files && files.length > 0) {
            const attachmentPromise = files.map(async (file) => {
                await this.prisma.ocrimages.create({
                    data: {
                        userId: userId,
                        fileName: file.originalname,
                        fileUrl: file['url'],
                        fileSize: file.size,
                        fileType: file.mimetype,
                    }
                })

                const ocrOptions = {
                    method: 'POST',
                    url: ocrEndPoint + '/vision/v3.2/ocr',
                    headers: {
                        'Ocp-Apim-Subscription-Key': azureApiKey,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        url: file['url']
                    }
                }

                if (!ocrOptions.data.url) {
                    throw new BadRequestException({
                        message: ['이미지 파일이 업로드되지 않았습니다. 다시 시도해주세요.'],
                        error: 'BadRequest',
                        statusCode: 400,
                    });
                }

                const ocrResponse = await axios(ocrOptions);
                const regions = ocrResponse.data.regions;
                if (regions.length > 0) {
                    regions.forEach((region) => {
                        region.lines.forEach((line) => {
                            const lineText = line.words.map((word) => word.text).join(' ');
                            ocrResults.push(lineText);
                            console.log(lineText);
                        })
                    })
                } else {
                    throw new BadRequestException({
                        message: ['OCR 요청 실패'],
                        error: 'BadRequest',
                        statusCode: 400,
                    })
                }
            })
            await Promise.all(attachmentPromise);
        } else {
            throw new BadRequestException({
                message: ['이미지 파일이 업로드되지 않았습니다. 다시 시도해주세요.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        const user = await this.prisma.users.findUnique({
            where: {
                id: userId,
                isDeleted: false,
            },
            select: {
                targetLanguage: true,
            }
        })

        if (!user) {
            throw new NotFoundException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'NotFound',
                statusCode: 404,
            });
        }

        const translateOptions = {
            method: 'POST',
            url: translateEndPoint + 'translate',
            headers: {
                'Ocp-Apim-Subscription-Key': azureApiKey,
                'Ocp-Apim-Subscription-Region': 'eastus',
                'Content-type': 'application/json'
            },
            params: {
                'api-version': '3.0',
                'from': 'ko',
                'to': user.targetLanguage,
            },
            data: ocrResults.map((text) => ({ text }))
        }

        const translateResponse = await axios(translateOptions);
        const data = translateResponse.data;
        let translateResults: string[] = [];
        if (data.length > 0) {
            data.forEach((item) => {
                translateResults.push(item.translations[0].text);
            })
        }
        console.log(translateResults);


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

    // 새로운 OCR - ai한테 ocr하고 이미지 번역까지 요청
    async ocrAndTranslateByAI(userId: number, files: Express.Multer.File[]) {
        const endpoint = this.configService.get('OPEN_AI_FOUNDRY_ENDPOINT');
        const apiKey = this.configService.get('OPEN_AI_FOUNDRY_API_KEY');
        const deployment = this.configService.get('OPEN_AI_FOUNDRY_DEPLOYMENT');
        const model = this.configService.get('OPEN_AI_FOUNDRY_MODEL');

        // 환경 변수 디버깅
        console.log('🔧 [DEBUG] 환경 변수 확인:');
        console.log('   - OPEN_AI_ENDPOINT:', endpoint);
        console.log('   - OPEN_AI_API_KEY:', apiKey ? '설정됨' : '설정되지 않음');
        console.log('   - OPEN_AI_DEPLOYMENT:', deployment);
        console.log('   - OPEN_AI_MODEL:', model);
        const apiVersion = '2024-04-01-preview';

        // 환경 변수 검증
        if (!endpoint || !apiKey || !deployment) {
            throw new Error(`Azure OpenAI 환경 변수가 설정되지 않았습니다. 
            endpoint: ${endpoint ? '설정됨' : '설정되지 않음'}
            apiKey: ${apiKey ? '설정됨' : '설정되지 않음'}
            deployment: ${deployment ? '설정됨' : '설정되지 않음'}`);
        }

        this.client = new AzureOpenAI({
            endpoint,
            apiKey,
            apiVersion,
            deployment
        });

        console.log('🚀 [DEBUG] Azure OpenAI 요청 시작');
        console.log('⏰ [DEBUG] 요청 시간:', new Date().toISOString());

        const user = await this.prisma.users.findUnique({
            where: {
                id: userId,
                isDeleted: false,
            },
            select: {
                targetLanguage: true,
            }
        });

        if (!user) {
            throw new NotFoundException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'NotFound',
                statusCode: 404,
            });
        }

        const targetLanguage = user.targetLanguage;
        const originalText: string[] = [];
        const translatedText: string[] = [];

        if (files && files.length > 0) {
            const attachmentPromise = files.map(async (file) => {
                await this.prisma.ocrimages.create({
                    data: {
                        userId: userId,
                        fileName: file.originalname,
                        fileUrl: file['url'],
                        fileSize: file.size,
                        fileType: file.mimetype,
                    }
                })
                const imageUrl = file['url'];

                console.log('🚀 [DEBUG] 이미지 정보 저장 완료');
                console.log('📂 [DEBUG] 저장된 이미지 URL:', imageUrl);

                // GPT-4 Vision 호출
                const response = await this.client.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are a JSON API. You must respond with raw JSON only. Do not use markdown formatting or code blocks."
                        },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Read Korean text from this image and translate to ${targetLanguage}.
          
                      CRITICAL: Return raw JSON only. No markdown, no backticks, no code blocks.
                      
                      Expected format:
                      {"originalText":["sentence1","sentence2"],"translatedText":["translation1","translation2"]}
                      
                      Rules:
                      - Raw JSON response only
                      - No \`\`\`json or \`\`\` markers
                      - Each sentence as separate array element
                      - Same array lengths for originalText and translatedText
                      - For math problems: keep equations and numbers intact`
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: imageUrl
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 4096,
                    temperature: 1,
                    top_p: 1,
                    model: model
                });

                if (!response.choices[0].message.content) {
                    throw new BadRequestException({
                        message: ['AI 응답이 비어있습니다.'],
                        error: 'BadRequest',
                        statusCode: 400,
                    });
                }

                // JSON 파싱 (코드 블록 제거)
                let content = response.choices[0].message.content;
                content = content.replace(/```json\n?/g, '');
                content = content.replace(/```\n?/g, '');
                content = content.trim();

                const jsonResponse = JSON.parse(content);

                // 응답 검증
                if (!jsonResponse.originalText || !jsonResponse.translatedText) {
                    throw new BadRequestException({
                        message: ['AI 응답 형식이 올바르지 않습니다.'],
                        error: 'BadRequest',
                        statusCode: 400,
                    });
                }

                if (jsonResponse.originalText.length !== jsonResponse.translatedText.length) {
                    throw new BadRequestException({
                        message: ['원문과 번역문의 개수가 일치하지 않습니다.'],
                        error: 'BadRequest',
                        statusCode: 400,
                    });
                }

                originalText.push(...jsonResponse.originalText);
                translatedText.push(...jsonResponse.translatedText);

                console.log('✅ [DEBUG] Azure OpenAI 응답 성공');
                console.log(jsonResponse);
            })
            await Promise.all(attachmentPromise);
        } else {
            throw new BadRequestException({
                message: ['이미지 파일이 업로드되지 않았습니다. 다시 시도해주세요.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        await this.prisma.translations.create({
            data: {
                originalText: originalText,
                menteeId: userId,
                translatedText: translatedText,
                keyConcept: '',
                solution: '',
                summary: '',
                createdAt: new Date(),
            }
        })

        return {
            message: 'OCR 요청 성공',
            statusCode: 200,
            data: {
                originalText: originalText,
                translatedText: translatedText
            },
        };
    }

    async solution(userId: number) {
        try {
            const user = await this.prisma.users.findUnique({
                where: {
                    id: userId,
                    isDeleted: false,
                },
                select: {
                    targetLanguage: true
                }
            })
            if (!user) {
                throw new UnauthorizedException({
                    message: ['사용자를 찾을 수 없습니다.'],
                    error: 'Unauthorized',
                    statusCode: 401,
                });
            }

            const requestUser = await this.prisma.translations.findFirst({
                where: {
                    menteeId: userId,
                },
                orderBy: {
                    id: 'desc'
                },
                select: {
                    originalText: true,
                }
            })
            if (!requestUser) {
                throw new NotFoundException({
                    message: ['문제를 찾을 수 없습니다.'],
                    error: 'NotFound',
                    statusCode: 404,
                });
            }

            const targetLanguage = user.targetLanguage;
            const problem: string[] = requestUser.originalText;

            // 민감한 단어들을 대체하는 함수
            const sanitizeText = (text: string[]) => {
                return text.map(line =>
                    line.replace(/제모/g, '모발 제거')
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
                        .replace(/통합/g, '연합')
                );
            };

            const sanitizedProblem = sanitizeText(problem);

            console.log('원본 텍스트:', problem);
            console.log('정제된 텍스트:', sanitizedProblem);

            const questionPrompt = `
            You are a helpful assistant for elementary school students who need problem explanations translated into ${targetLanguage}.
            Please describe the problem in a way that is easy to understand for elementary school students.

            Given the following problem:
            ${sanitizedProblem.join('\n')}
            
            Please provide:
            1. A detailed explanation of the problem in ${targetLanguage} (within 300 characters)
            2. Key concepts that are important for understanding this problem (express as a single word)
            3. A brief summary of the problem approach

            Please respond in the following JSON format:
            {
                "solution": "detailed explanation here",
                "keyConcept": "key concepts here",
                "summary": "brief summary here"
            }

            Make sure your response is valid JSON and the explanation is in ${targetLanguage}.
        `;

            const messages: any[] = [
                {
                    "role": "system",
                    "content": questionPrompt
                },
                {
                    "role": "user",
                    "content": `Hello, im a student and i need help understanding the problem ${sanitizedProblem.join('\n')} 
                                and i need to know the key concepts of the problem.
                        `
                }
            ];

            const gptResults = await this.client.chat.completions.create({
                model: this.configService.get('OPEN_AI_DEPLOYMENT') || 'o4-mini',
                messages: messages,
                max_completion_tokens: 10000
            });

            // GPT 응답 파싱
            let gptContent = gptResults.choices[0].message.content;
            console.log('GPT 응답 내용:', gptContent);
            console.log('GPT 응답 타입:', typeof gptContent);

            if (!gptContent) {
                throw new BadRequestException({
                    message: ['GPT 응답이 비어있습니다.'],
                    error: 'BadRequest',
                    statusCode: 400,
                });
            }

            // ```json과 ``` 제거
            gptContent = gptContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

            let gptResponse;
            try {
                gptResponse = JSON.parse(gptContent);
            } catch (error) {
                console.error('JSON 파싱 에러:', error);
                console.error('파싱하려던 내용:', gptContent);
                throw new BadRequestException({
                    message: ['GPT 응답을 JSON으로 파싱할 수 없습니다.'],
                    error: 'BadRequest',
                    statusCode: 400,
                });
            }

            const translationRecord = await this.prisma.translations.findFirst({
                where: {
                    menteeId: userId
                },
                orderBy: {
                    id: 'desc'
                }
            });

            if (!translationRecord) {
                throw new NotFoundException({
                    message: ['번역 레코드를 찾을 수 없습니다.'],
                    error: 'NotFound',
                    statusCode: 404,
                });
            }

            await this.prisma.translations.update({
                where: {
                    id: translationRecord.id
                },
                data: {
                    keyConcept: gptResponse.keyConcept,
                    solution: gptResponse.solution,
                    summary: gptResponse.summary,
                }
            })

            return {
                message: 'Solution 요청 성공',
                statusCode: 200,
                keyConcept: gptResponse.keyConcept,
                solution: gptResponse.solution,
                summary: gptResponse.summary,
            }
        } catch (error) {
            this.logger.error('Solution 요청 실패: ', error)

            throw new BadRequestException({
                message: ['Solution 요청 실패'],
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