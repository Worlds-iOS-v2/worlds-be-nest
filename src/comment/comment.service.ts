import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { connect } from 'http2';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportReason } from '@prisma/client';
import { UserService } from 'src/user/user.service';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) { }

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

  // 대댓글 작성
  async createReplyComment(
    userId: number,
    parentId: number,
    dto: CreateCommentDto,
  ) {
    // 부모 댓글 조회
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parentComment) {
      throw new Error('부모 댓글이 존재하지 않습니다.');
    }
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        userId,
        parentId,
        questionId: parentComment.questionId,
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
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            isMentor: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  // 자기 답변 조회
  async getMyComments(userId: number) {
    return this.prisma.comment.findMany({
      where: { userId },
      include: {
        question: true,
        user: {
          select: {
            id: true,
            userName: true,
            isMentor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 댓글 신고
  async reportComment(
    commentId: number,
    dto: CreateReportDto,
    reporterId: number,
  ) {
    const existingReport = await this.prisma.report.findFirst({
      where: {
        commentId,
        reporterId,
      },
    });

    if (existingReport) {
      throw new BadRequestException('이미 이 댓글을 신고하셨습니다.');
    }

    // 기타 사유일 경우 etcReason이 있는지 체크
    if (dto.reason === ReportReason.etc && !dto.etcReason) {
      throw new BadRequestException('기타 사유를 입력해주세요.');
    }

    // 댓글 작성자의 신고 횟수 증가
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true }
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: comment.userId }, // 신고받는 사람
      data: {
        reportCount: {
          increment: 1,
        },
      },
    });

    // 10회 이상이면 차단
    if (updatedUser.reportCount >= 10) {
      await this.userService.blockUser(comment.userId);
    }

    return this.prisma.report.create({
      data: {
        reason: dto.reason,
        etcReason: dto.etcReason,
        reporterId,
        commentId,
        questionId: dto.questionId,
      },
    });
  }

  // 댓글 soft-delete
  async deleteComment(id: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.userId !== userId)
      throw new Error('권한 없음 또는 댓글 없음');

    return this.prisma.comment.update({
      where: { id },
      data: {
        deleted: true,
      },
    });
  }
}
