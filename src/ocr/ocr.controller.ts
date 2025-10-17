import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Request, UploadedFiles, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { HttpExceptionFilter } from 'src/common/interceptor/http-exception.filter';
import { GetOcrRecordsDto } from './dto/GetOcrRecordsDto';
import { AskQuestionDto } from './dto/ask-question.dto';

@Controller('ocr')
@ApiTags('문제 분석 및 요약')
@UseFilters(HttpExceptionFilter)
export class OcrController {
  constructor(private readonly ocrService: OcrService) { }

  @Post('')
  @ApiOperation({ summary: 'OCR 요청' })
  @ApiResponse({ status: 200, description: 'OCR 요청 성공' })
  @ApiBearerAuth()
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
  @UseInterceptors(FilesInterceptor('files', 5))
  @UseGuards(JwtAuthGuard)
  async ocr(@UploadedFiles() files: Express.Multer.File[], @Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.ocrService.ocr(userId, files);
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

  @Post('ask-question')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '질문 답변 요청' })
  @ApiResponse({ status: 200, description: '질문 답변 성공' })
  @UseInterceptors(ResponseInterceptor)
  @ApiBody({ type: AskQuestionDto })
  async askQuestion(
    @Request() req: ExpressRequest,
    @Body() askQuestionDto: AskQuestionDto,
  ) {
    const userId = (req.user as any).id;
    return this.ocrService.askQuestion(userId, askQuestionDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '내 OCR 기록 조회' })
  @ApiResponse({ status: 200, description: 'OCR 기록 조회 성공', type: GetOcrRecordsDto })
  async getOcrRecords(@Param('id', ParseIntPipe) id: number) {
    return this.ocrService.getMyOcr(id);
  }
}

