//QR 발급, 인증, 검증
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PairingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * QR에 담을 일회성 페어링 토큰 발급
   * @param ownerId 토큰을 발급하는 사용자 ID (멘토/멘티 무관)
   * @param ttlMinutes 유효시간(분)
   */
  async createPairingToken(ownerId: number, ttlMinutes = 10) {
    // 발급자 존재 체크(방어적)
    const owner = await this.prisma.users.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('발급자(사용자)를 찾을 수 없습니다.');

    const token = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const record = await this.prisma.pairingToken.create({
      data: { token, ownerId, expiresAt },
      select: { token: true, expiresAt: true },
    });

    return record; // { token, expiresAt }
  }

  /**
   * QR 스캔 후 토큰 제출 시 채팅방 생성/가져오기
   * @param claimerId 토큰을 사용하는 사용자 ID (상대방)
   * @param token QR에 담겨온 토큰 문자열
   */
  async claimPairingToken(claimerId: number, token: string) {
    const rec = await this.prisma.pairingToken.findUnique({ where: { token } });
    if (!rec) throw new NotFoundException('유효하지 않은 토큰입니다.');
    if (rec.usedAt) throw new BadRequestException('이미 사용된 토큰입니다.');
    if (rec.expiresAt < new Date()) throw new BadRequestException('토큰이 만료되었습니다.');

    if (rec.ownerId === claimerId) {
      throw new ForbiddenException('자기 자신의 토큰은 사용할 수 없습니다.');
    }

    // 두 사용자 존재 확인(방어적)
    const [owner, claimer] = await Promise.all([
      this.prisma.users.findUnique({ where: { id: rec.ownerId } }),
      this.prisma.users.findUnique({ where: { id: claimerId } }),
    ]);
    if (!owner || !claimer) throw new NotFoundException('사용자 정보를 확인할 수 없습니다.');

    // 방 생성/가져오기 (중복 방지: 작은 ID를 A로 정렬)
    const room = await this.createOrGetRoom(rec.ownerId, claimerId);

    // 토큰 사용 처리
    await this.prisma.pairingToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return room;
  }

  /**
   * (내부) 두 사용자 간의 1:1 채팅방을 생성하거나 기존 방을 반환
   */
  private async createOrGetRoom(userId1: number, userId2: number) {
    const [a, b] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    const existing = await this.prisma.chatRoom.findFirst({
      where: { userAId: a, userBId: b },
      include: {
        userA: { select: { id: true, userName: true } },
        userB: { select: { id: true, userName: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (existing) return existing;

    return this.prisma.chatRoom.create({
      data: { userAId: a, userBId: b },
      include: {
        userA: { select: { id: true, userName: true } },
        userB: { select: { id: true, userName: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }
}