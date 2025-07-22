import { BadRequestException, Body, Controller, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequestOCRDto } from './dto/RequestOCTDto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { AzureStorageInterceptor } from 'src/azure-storage/azure-storage.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}
  
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedType = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
        ];
        if (allowedType.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
    AzureStorageInterceptor,
  )
  @ApiOperation({ summary: 'OCR 요청' })
  @ApiResponse({ status: 200, description: 'OCR 요청 성공' })
  @ApiBody({ type: RequestOCRDto })
  @UseGuards(JwtAuthGuard)
  async ocr(@Request() req: ExpressRequest) {
    const userId = (req.user as any).sub;
    return this.ocrService.ocr(userId, req.files as Express.Multer.File[])
  }

  @Post('solution')
  @ApiOperation({ summary: 'Solution 요청' })
  @ApiResponse({ status: 200, description: 'Solution 요청 성공' })
  @UseGuards(JwtAuthGuard)
  async solution(@Request() req: ExpressRequest) {
    const userId = (req.user as any).sub;
    return this.ocrService.solution(userId);
  }
}
