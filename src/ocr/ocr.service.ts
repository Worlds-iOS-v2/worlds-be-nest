import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class OcrService {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService
    ){}

    async ocr(imageUrl: string) {
        const apiKey = this.configService.get('AZURE_AI_VISION_API_KEY');
        const endPoint = this.configService.get('AZURE_AI_VISION_ENDPOINT');

        const options = {
            method: 'POST',
            url: endPoint,
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json'
            },
            data: {
                url: imageUrl
            }
        }

        const response = await axios(options);
        const regions = response.data.regions;
        if (regions.length > 0) {
            regions.forEach((region) => {
                region.lines.forEach((line) => {
                    const words = line.words.map((word) => word.text).join(' ');
                    console.log(words);
                })
            })
        }
        
    }

}
