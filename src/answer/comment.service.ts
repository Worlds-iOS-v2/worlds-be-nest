import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { connect } from 'http2';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  // 댓글 작성
  async createComment(
    userId: number,
    questionId: number,
    dto: CreateCommentDto,
  ) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        userId,
        questionId,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            inMentor: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });
  }

  // 대댓글 작성
  async createReplyComment(
    userId: number,
    parentId: number,
    dto: CreateCommentDto,
  ) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        userId,
        parent: { connect: { id: parentId } },
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            isMentor: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });
  }

  // 게시글별 답변 조회
  async getCommentsByQuestion(questionId: number) {
    return this.prisma.comment.findMany({
      where: { questionId },
      include: { user: true },
      orderBy: { id: 'asc' },
    });
  }

  // 자기 답변 조회
  async getMyComments(userId: number) {
    return this.prisma.comment.findMany({
      where: { userId },
      include: {
        question: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 답변 삭제
  async deleteComment(id: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.userId !== userId)
      throw new Error('권한 없음 또는 답변 없음');
    return this.prisma.comment.delete({ where: { id } });
  }
}
