import { BadRequestException, Body, Controller, Get, Post, Request, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { AzureStorageInterceptor } from 'src/azure-storage/azure-storage.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { HttpExceptionFilter } from 'src/common/interceptor/http-exception.filter';

@Controller('ocr')
@ApiTags('문제 분석 및 요약')
@UseInterceptors(ResponseInterceptor)
@UseFilters(HttpExceptionFilter)
@ApiBearerAuth()
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '업로드할 이미지 파일들 (최대 5개, 각 파일 최대 5MB)',
        },
      },
      required: ['files']
    }
  })
  @UseGuards(JwtAuthGuard)
  async ocr(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.ocrService.ocr(userId, req.files as Express.Multer.File[])
  }

  @Get('solution')
  @ApiOperation({ summary: 'Solution 요청' })
  @ApiResponse({ status: 200, description: 'Solution 요청 성공' })
  @UseGuards(JwtAuthGuard)
  async solution(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.ocrService.solution(userId);
  }
}
