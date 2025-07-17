import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionDto } from './dto/list-question.dto';
import { ResponseQuesitonDto } from './dto/detail-question.dto';
import { Category } from 'src/common/enums/category.enum';

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
        isDeleted: false, // 삭제되지 않은 질문만 조회
        ...(category && { category }),
        },
        include: {
        answers: true, 
        },
        orderBy: {
        createdAt: 'desc',
        },
    });

    return questions.map((q) => ({
        category: q.category,
        title: q.title,
        content: q.content,
        answerCount: q.answers.length,
    }));
    }

    //질문 상세 조회
    async getQuestionDetail(id: number): Promise<ResponseQuesitonDto> {
    const question = await this.prisma.question.findFirst({
      where: { id, isDeleted: false },
      include: {
        user: true,
        attachments: true,
        answers: true,
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
      answerCount: question.answers.length,
      category: question.category,
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
}

