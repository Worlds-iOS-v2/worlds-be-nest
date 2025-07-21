import { Body, Controller, Post, Request } from '@nestjs/common';
import { ReportService } from './comment-report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('report')
@ApiTags('report')
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async reportContent(@Body() dto: CreateReportDto, @Request() req) {
    const reporterId = req.user.id; // JWT에서 가져옴
    return this.reportService.reportComment(dto, reporterId);
  }
}
