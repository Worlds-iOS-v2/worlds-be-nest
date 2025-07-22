import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ReportReason } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @IsEnum(ReportReason)
  @ApiProperty({ example: 'offensive', enum: ReportReason })
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '기타 이유를 입력해주세요' })
  etcReason?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ example: 42, description: '댓글이 속한 질문 ID' })
  questionId?: number;
}
