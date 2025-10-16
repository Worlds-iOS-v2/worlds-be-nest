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

@Injectable()
export class OcrService {
    private client: AzureOpenAI;
    private logger = new Logger();
    private worker: Worker | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly utilsService: UtilsService,
        private readonly awsS3: AWSS3Service,
        private readonly translateService: TranslateService
    ) { }

    async init() {
        this.worker = await createWorker('kor')
    }

    private async imageUpload(userId: number, file: Express.Multer.File) {
        const imageName = file.originalname + this.utilsService.getUUID();
        const ext = file.originalname.split('.').pop();
        if (!ext) {
            throw new BadRequestException({
                message: ['파일 확장자를 확인할 수 없습니다.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        const imageUrl = await this.awsS3.uploadFile(
            `${imageName}.${ext}`, file, ext
        )
        if (!imageUrl) {
            throw new BadRequestException({
                message: ['이미지 업로드에 실패했습니다.'],
                error: 'BadRequest',
                statusCode: 400,
            })
        }

        await this.prisma.ocrimages.create({
            data: {
                userId: userId,
                fileName: file.originalname,
                fileUrl: imageUrl,
                fileSize: file.size,
                fileType: file.mimetype,
            }
        })

        return {
            imageUrl: imageUrl,
        };
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
        const uploadFile = await this.imageUpload(userId, files[0]);
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

        const originalText =  data.text.trim()
        const translateText = await this.translateService.translate(originalText, "auto", user.targetLanguage);

        const ocrResults = originalText.split('\n').filter(line => line.trim() !== '');
        const translateResults = translateText.split('\n').filter(line => line.trim() !== '');
        
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

    async onModuleDestroy() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
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