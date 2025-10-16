import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UtilsModule } from 'src/common/utils/utils.module';
import { AwsS3Module } from 'src/common/aws-s3/aws-s3.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TranslateModule } from 'src/translate/translate.module';

@Module({
  imports: [ConfigModule, PrismaModule, UtilsModule, AwsS3Module, TranslateModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      }
    })
  ],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
