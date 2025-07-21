import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async reportComment(dto: CreateReportDto, reporterId: number) {
    return await this.prisma.report.create({
      data: {
        reason: dto.reason,
        reporterId,
        commentId: dto.commentId,
        questionId: dto.questionId,
      },
    });
  }
}
