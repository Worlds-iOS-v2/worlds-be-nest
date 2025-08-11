import { ReportReason } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class ReportDto {
  @ApiProperty({ enum: ReportReason, description: '신고 사유' })
  @IsEnum(ReportReason)
  reason: ReportReason;
}