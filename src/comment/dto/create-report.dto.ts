import { IsEnum, IsOptional, IsInt } from 'class-validator';
import { ReportReason } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @IsEnum(ReportReason)
  @ApiProperty({ example: '욕설을 포함하고 있어요' })
  reason: ReportReason;

  @IsOptional()
  @IsInt()
  @ApiProperty({ example: 42 })
  questionId?: number;
}
