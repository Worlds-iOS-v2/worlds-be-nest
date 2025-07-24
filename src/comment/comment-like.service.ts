import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentLikeService {
  constructor(private prisma: PrismaService) {}

  // 댓글 좋아요
  async commentLike(userId: number, commentId: number) {
    try {
      return await this.prisma.commentLike.create({
        data: { userId, commentId },
      });
    } catch (e) {
      return {
        message: '이미 좋아요를 누르셨거나 실패하였습니다.',
        error: e.message,
      };
    }
  }

  // 댓글별 좋아요 수 조회
  async commentLikeCount(commentId: number) {
    return await this.prisma.commentLike.count({
      where: { commentId },
    });
  }

  // 사용자가 특정 댓글에 좋아요 여부
  async isLiked(userId: number, commentId: number): Promise<boolean> {
    const existing = await this.prisma.commentLike.findFirst({
      where: { userId, commentId },
    });
    return existing !== null;
  }

  // 좋아요 취소
  async commentUnlike(userId: number, commentId: number) {
    return await this.prisma.commentLike.deleteMany({
      where: { userId, commentId },
    });
  }
}
