import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';

@Module({
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
