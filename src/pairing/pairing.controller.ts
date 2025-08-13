import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PairingService } from './pairing.service';

@ApiTags('Pairing')
@ApiBearerAuth()
@Controller('pairings')
export class PairingController {
  constructor(private readonly pairingService: PairingService) {}

  /**
   * QR에 담을 일회성 페어링 토큰 발급 (기본 10분 유효)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '페어링 토큰 발급 (QR 생성용)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ttlMinutes: { type: 'integer', example: 10, description: '유효시간(분), 선택' },
      },
    },
  })
  async createPairing(@Req() req: Request, @Body('ttlMinutes') ttlMinutes?: number) {
    const user = req.user as any;
    const ttl = Number.isFinite(Number(ttlMinutes)) ? Number(ttlMinutes) : 10;
    return this.pairingService.createPairingToken(Number(user.id), ttl);
  }

  /**
   * QR 스캔으로 받은 토큰 제출 → 채팅방 생성/가져오기
   */
  @Post('claim')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '페어링 토큰 사용 (채팅방 생성/가져오기)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', example: 'eyJhbGciOi... (base64url)', description: 'QR에 담긴 토큰' },
      },
    },
  })
  async claimPairing(@Req() req: Request, @Body('token') token: string) {
    const user = req.user as any;
    return this.pairingService.claimPairingToken(Number(user.id), token);
  }
}
