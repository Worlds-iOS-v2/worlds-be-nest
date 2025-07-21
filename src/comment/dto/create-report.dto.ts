import { IsEnum, IsOptional, IsInt } from 'class-validator';
import { ReportReason } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsInt()
  commentId?: number;

  @IsOptional()
  @IsInt()
  questionId?: number;
}
