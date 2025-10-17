import { BadRequestException, Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid';
import { AWSS3Service } from "../aws-s3/aws-s3.service";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UtilsService {
    constructor(
        private readonly awsS3: AWSS3Service,
        private readonly prisma: PrismaService,
    ) { }

    getUUID(): string {
        return uuidv4();
    }

    async imageUpload(userId: number, file: Express.Multer.File) {
        const imageName = file.originalname + this.getUUID();
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

    async imageUploads(userId: number, files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException({
                message: ['업로드할 파일이 없습니다.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        // Promise.all을 이용한 병렬 처리
        const uploadedImages = await Promise.all(
            files.map(async (file) => {
                const ext = file.originalname.split('.').pop();
                if (!ext) {
                    throw new BadRequestException({
                        message: ['파일 확장자를 확인할 수 없습니다.'],
                        error: 'BadRequest',
                        statusCode: 400,
                    });
                }

                const imageName = `${file.originalname}-${this.getUUID()}.${ext}`;
                const imageUrl = await this.awsS3.uploadFile(imageName, file, ext);

                if (!imageUrl) {
                    throw new BadRequestException({
                        message: ['이미지 업로드에 실패했습니다.'],
                        error: 'BadRequest',
                        statusCode: 400,
                    });
                }

                // DB 저장
                await this.prisma.ocrimages.create({
                    data: {
                        userId,
                        fileName: file.originalname,
                        fileUrl: imageUrl,
                        fileSize: file.size,
                        fileType: file.mimetype,
                    },
                });

                return imageUrl;
            }),
        );

        return {
            count: uploadedImages.length,
            imageUrls: uploadedImages,
        };
    }


}