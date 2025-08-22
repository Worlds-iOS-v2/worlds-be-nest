import { BadRequestException, Controller, Get, Param, ParseIntPipe, Post, Request, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { AzureStorageInterceptor } from 'src/azure-storage/azure-storage.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { HttpExceptionFilter } from 'src/common/interceptor/http-exception.filter';
import { GetOcrRecordsDto } from './dto/GetOcrRecordsDto';

@Controller('ocr')
@ApiTags('문제 분석 및 요약')
@UseFilters(HttpExceptionFilter)
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
  @ApiBearerAuth()
  @UseInterceptors(ResponseInterceptor)
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

  @Post('ai')
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
  @ApiBearerAuth()
  @UseInterceptors(ResponseInterceptor)
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
  async ocrByAI(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.ocrService.ocrAndTranslateByAI(userId, req.files as Express.Multer.File[])
  }

  @Get('solution')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Solution 요청' })
  @ApiResponse({ status: 200, description: 'Solution 요청 성공' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async solution(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.ocrService.solution(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '내 OCR 기록 조회'})
  @ApiResponse({ status: 200, description: 'OCR 기록 조회 성공', type: GetOcrRecordsDto})
  async getOcrRecords(@Param('id', ParseIntPipe) id: number) {
    return this.ocrService.getMyOcr(id);
  }
}

