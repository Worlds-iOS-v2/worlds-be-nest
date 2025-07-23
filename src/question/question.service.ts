import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionDto } from './dto/list-question.dto';
import { ResponseQuesitonDto } from './dto/detail-question.dto';
import { Category } from 'src/common/enums/category.enum';
import { ReportDto } from './dto/report-question.dto';

@Injectable()
export class QuestionService {
    constructor(private readonly prisma: PrismaService) {}

    //질문 생성
    async createQuestion(
        createQuestionDto: CreateQuestionDto,
        userId: number,
        imageUrls?: string[],
    ) {
        const question = await this.prisma.question.create({
            data: {
                title: createQuestionDto.title,
                content: createQuestionDto.content,
                category: createQuestionDto.category,
                user: { connect: { id: userId } },
                attachments: imageUrls ? { create: imageUrls.map(url => ({ url })) } : undefined,
            },
            include: { attachments: true },
        });

        return question;

    }

    //질문 목록 조회
    async getQuestionList(category?: Category): Promise<ListQuestionDto[]> {
  const questions = await this.prisma.question.findMany({
    where: {
      isDeleted: false,
      ...(category && { category }),
    },
    include: {
      comments: true,
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return questions.map((q) => ({
    id: q.id,
    title: q.title,
    content: q.content,
    category: q.category as Category,
    createdAt: q.createdAt,
    isAnswered: q.comments.length > 0,
    answerCount: q.comments.length,
    user: {
      id: q.user.id,
      user_name: q.user.userName,
      user_email: q.user.userEmail,
      user_role: q.user.isMentor,
    },
  }));
}

    //질문 상세 조회
    async getQuestionDetail(id: number): Promise<ResponseQuesitonDto> {
    const question = await this.prisma.question.findFirst({
      where: { id, isDeleted: false },
      include: {
        user: true,
        attachments: true,
        comments: true,
      },
    });

    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    return {
      title: question.title,
      content: question.content,
      createdAt: question.createdAt,
      userName: question.user.userName,
      answerCount: question.comments.length,
      category: question.category as Category,
      attachments: question.attachments.map((a) => a.url),
    };
  }


  // 질문 삭제 (soft delete)
  async deleteQuestion(id: number, userId: number): Promise<void> {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question || question.isDeleted) {
      throw new NotFoundException('질문이 존재하지 않거나 이미 삭제되었습니다.');
    }

    if (question.userId !== userId) {
      throw new Error('삭제 권한이 없습니다.');
    }

    await this.prisma.question.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
  }

  // 질문 신고
  async reportQuestion(questionId: number, reporterId: number, dto: ReportDto) {
    return this.prisma.report.create({
      data: {
        reason: dto.reason,
        // etcReason: dto.etcReason, // 기타 사유 입력 시 사용
        reporterId,
        questionId,
      },
    });
  }
}

