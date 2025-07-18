import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
import { RequestOCRDto } from './dto/RequestOCTDto';

@Injectable()
export class OcrService {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService
    ){}

    async ocr(userId: number,requestocrform: RequestOCRDto) {
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

        await this.prisma.translations.create({
            data: {
                originalText: ocrResults,
                keyConcept: '',
                menteeId: userId,
                translatedText: translateResults,
                createdAt: new Date(),
            }
        })

        return {
            message: 'OCR 요청 성공',
            data: ocrResults,
            statusCode: 200,
        }
    }

}
