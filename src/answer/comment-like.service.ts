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
      return { message: 'Already liked or failed', error: e.message };
    }
  }

  // 좋아요 취소
  async commentUnlike(userId: number, commentId: number) {
    return await this.prisma.commentLike.deleteMany({
      where: { userId, commentId },
    });
  }
}
