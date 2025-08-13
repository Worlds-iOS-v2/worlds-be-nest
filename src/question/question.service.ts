import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionDto } from './dto/list-question.dto';
import { ResponseQuesitonDto } from './dto/detail-question.dto';
import { Category } from 'src/common/enums/category.enum';
import { ReportDto } from './dto/report-question.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class QuestionService {
  [x: string]: any;
    constructor(private readonly prisma: PrismaService,
      private readonly userService: UserService,
    ) {}

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
      id: question.id,
      title: question.title,
      content: question.content,
      createdAt: question.createdAt,
      answerCount: question.comments.length,
      category: question.category as Category,
      attachments: question.attachments.map((a) => a.url),
      user: { //userName삭제하고 user객체로 통합
        id: question.user.id,
        user_name: question.user.userName,
        user_email: question.user.userEmail,
        user_role: question.user.isMentor,
  },
      
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

    // 질문 작성자의 신고 횟수 증가
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { userId: true }
    });

    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: question.userId },
      data: {
        reportCount: {
          increment: 1,
        },
      }
    })

    // 10회 이상이면 차단
    if (updatedUser.reportCount >= 10) {
      await this.userService.blockUser(question.userId);
    }

    return this.prisma.report.create({
      data: {
        reason: dto.reason,
        // etcReason: dto.etcReason, // 기타 사유 입력 시 사용
        reporterId,
        questionId,
      },
    });
  }

  // 내 질문 조회
  // async getMyQuestions(userId: number): Promise<ListQuestionDto[]> {
  
  async getMyQuestions(userId: number): Promise<Omit<ListQuestionDto, 'user'>[]> {
    const questions = await this.prisma.question.findMany({
      where: {
        isDeleted: false,
        userId: userId,
      },
      include: {
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return questions.map((q) => ({
      id: q.id,
      category: q.category as Category,
      title: q.title,
      content: q.content,
      createdAt: q.createdAt,
      isAnswered: q.comments.length > 0,
      answerCount: q.comments.length,
    }));
  }




}

