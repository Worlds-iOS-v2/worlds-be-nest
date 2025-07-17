import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ReportReason } from 'src/common/enums/report-reason.enum';

export class ReportDto {
  @ApiProperty({ description: '신고 사유', enum: ReportReason })
  @IsEnum(ReportReason)
  @IsNotEmpty()
  reason: ReportReason;
}