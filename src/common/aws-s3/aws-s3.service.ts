import { BadRequestException, Injectable } from "@nestjs/common";
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AWSS3Service {
    s3: S3Client;

    constructor(
        private configService: ConfigService
    ) {
        const region = this.configService.get<string>('AWS_S3_REGION');
        const accessKeyId = this.configService.get<string>('AWS_S3_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_S3_SECRET_ACCESS_KEY');

        if (!region || !accessKeyId || !secretAccessKey) {
            throw new BadRequestException({
                message: ['AWS S3 설정이 올바르지 않습니다.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        this.s3 = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async uploadFile(fileName: string, file: Express.Multer.File, ext: string) {
        console.log(file.buffer)

        try {
            const command = new PutObjectCommand({
                Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
                Key: fileName,
                Body: file.buffer,
                ACL: 'public-read',
                ContentType: `image/${ext}`,
            })
            
            await this.s3.send(command)

            return `https://s3.${this.configService.get('AWS_S3_REGION')}.amazonaws.com/${this.configService.get('AWS_S3_BUCKET_NAME')}/${fileName}`;
        } catch (error) {
            console.error('AWS S3 업로드 에러:', error);
        }
    }
}