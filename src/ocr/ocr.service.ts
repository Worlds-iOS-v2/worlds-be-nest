import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
import { RequestOCRDto } from './dto/RequestOCTDto';
import { AzureOpenAI } from 'openai';

@Injectable()
export class OcrService {
    private client: AzureOpenAI;

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

    async ocr(userId: number, requestocrform: RequestOCRDto) {
        const azureApiKey = this.configService.get('AI_SERVICES_API_KEY');
        const ocrEndPoint = this.configService.get('OCR_ENDPOINT');
        const translateEndPoint = this.configService.get('TRANSLATE_ENDPOINT');
        const openAiEndpoint = this.configService.get('OPEN_AI_ENDPOINT');
        const openAiApiKey = this.configService.get('OPEN_AI_API_KEY');

        if (!azureApiKey || !ocrEndPoint || !translateEndPoint || !openAiEndpoint || !openAiApiKey) {
            throw new Error('API 키 또는 엔드포인트가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
        }

        const ocrOptions = {
            method: 'POST',
            url: ocrEndPoint + '/vision/v3.2/ocr',
            headers: {
                'Ocp-Apim-Subscription-Key': azureApiKey,
                'Content-Type': 'application/json'
            },
            data: {
                url: requestocrform.imageUrl
            }
        }

        const ocrResponse = await axios(ocrOptions);
        const regions = ocrResponse.data.regions;
        let ocrResults: string[] = [];
        if (regions.length > 0) {
            regions.forEach((region) => {
                region.lines.forEach((line) => {
                    const lineText = line.words.map((word) => word.text).join(' ');
                    ocrResults.push(lineText);
                    console.log(lineText);
                })
            })
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
                'to': 'en'
                // this.prisma.users.findUnique({
                //     where: {
                //         id: userId,
                //     },
                //     select: {
                //         targetLanguage: true,
                //     }
                // })
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

        const user = await this.prisma.users.findUnique({
            where: {
                id: userId,
            },
            select: {
                targetLanguage: true
            }
        })
        if (!user) {
            throw new NotFoundException('사용자를 찾을 수 없습니다.');
        }
        const targetLanguage = user.targetLanguage;

        const questionPrompt = `
                You are a helpful assistant for students who need problem explanations translated into en.

                Given the following problem:
                ${translateResults.join('\n')}

                Please provide:
                1. A detailed solution to the problem in english
                2. Key concepts that are important for understanding this problem (express as a single word)
                3. A brief summary of what the problem is asking

                Please respond in the following JSON format:
                {
                    "solution": "detailed solution here",
                    "keyConcept": "key concepts here",
                    "summary": "brief summary here"
                }

                Make sure your response is valid JSON and the solution is in en.
            `;

        const messages: any[] = [
            {
                "role": "system",
                "content": questionPrompt
            },
            {
                "role": "user",
                "content": `Hello, im a student and i need to solve the problem ${translateResults.join('\n')} 
                                and i need to know the key concepts of the problem.
                        `
            }
        ];

        const gptResults = await this.client.chat.completions.create({
            model: this.configService.get('OPEN_AI_DEPLOYMENT') || 'o4-mini',
            messages: messages,
            max_completion_tokens: 10000
        });

                // GPT 응답을 JSON으로 파싱
        const gptContent = gptResults.choices[0].message.content;
        console.log('GPT 응답 내용:', gptContent);
        console.log('GPT 응답 타입:', typeof gptContent);
        
        if (!gptContent) {
            throw new Error('GPT 응답이 비어있습니다.');
        }
        
        let gptResponse;
        try {
            gptResponse = JSON.parse(gptContent);
        } catch (error) {
            console.error('JSON 파싱 에러:', error);
            console.error('파싱하려던 내용:', gptContent);
            throw new Error('GPT 응답을 JSON으로 파싱할 수 없습니다.');
        }

        await this.prisma.translations.create({
            data: {
                originalText: ocrResults,
                keyConcept: gptResponse.keyConcept,
                menteeId: userId,
                translatedText: translateResults,
                createdAt: new Date(),
            }
        })

        return {
            message: 'OCR 요청 성공',
            data: [
                {
                    originalText: ocrResults,
                    translatedText: translateResults,
                    keyConcept: gptResponse.keyConcept,
                    solution: gptResponse.solution,
                    summary: gptResponse.summary
                }
            ],
            statusCode: 200,
        }
    }

    async solution(userId: number, problem: string[]) {
        try {
            const user = await this.prisma.users.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    targetLanguage: true
                }
            })
            if (!user) {
                throw new NotFoundException('사용자를 찾을 수 없습니다.');
            }
            const targetLanguage = user.targetLanguage;

            const questionPrompt = `
                You are a helpful assistant for students who need problem explanations translated into ${targetLanguage}.

                Given the following problem:
                ${problem.join('\n')}

                Please provide:
                1. A detailed solution to the problem in ${targetLanguage}
                2. Key concepts that are important for understanding this problem (express as a single word)
                3. A brief summary of what the problem is asking

                Please respond in the following JSON format:
                {
                    "solution": "detailed solution here",
                    "keyConcept": "key concepts here",
                    "summary": "brief summary here"
                }

                Make sure your response is valid JSON and the solution is in ${targetLanguage}.
            `;

            const messages: any[] = [
                {
                    "role": "system",
                    "content": questionPrompt
                },
                {
                    "role": "user",
                    "content": `Hello, im a student and i need to solve the problem ${problem.join('\n')} 
                                and i need to know the key concepts of the problem.
                    `
                }
            ];

            const result = await this.client.chat.completions.create({
                model: this.configService.get('AZURE_OPENAI_DEPLOYMENT_NAME') || 'o4-mini',
                messages: messages,
                max_completion_tokens: 1000
            });

            return result;
        } catch (error) {
            throw new Error(`OpenAI API 호출 실패: ${error.message}`);
        }
    }

}
