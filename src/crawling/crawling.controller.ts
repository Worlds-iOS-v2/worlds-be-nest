import { Controller, Get } from '@nestjs/common';
import { CrawlingService } from './crawling.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CrawlResponseDto } from './dto/CrawlResponseDto';

@Controller('crawl')
@ApiTags('크롤링')
export class CrawlingController {
  constructor(private readonly crawlingService: CrawlingService) {}

  @Get()
  @ApiOperation({ summary: '크롤링 데이터 조회' })
  @ApiResponse({
    status: 200,
    description: '크롤링 데이터 조회 성공',
    type: CrawlResponseDto
  })
  async getCrawlData(): Promise<CrawlResponseDto> {
    return this.crawlingService.getCrawlData();
  }
}
