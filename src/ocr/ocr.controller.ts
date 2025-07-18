import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequestOCRDto } from './dto/RequestOCTDto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post()
  @ApiOperation({ summary: 'OCR 요청' })
  @ApiResponse({ status: 200, description: 'OCR 요청 성공' })
  @ApiBody({ type: RequestOCRDto })
  @UseGuards(JwtAuthGuard)
  async ocr(@Request() req: ExpressRequest) {
    const userId = (req.user as any).sub;
    const requestOCRDto = req.body as RequestOCRDto;
    return this.ocrService.ocr(userId, requestOCRDto)
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
