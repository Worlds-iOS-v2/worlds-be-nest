import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('번역')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  async translate(@Body() body: { text: string; source: string; target: string }) {
    const result = await this.translateService.translate(body.text, body.source, body.target);
    return { translated: result };
  }
}