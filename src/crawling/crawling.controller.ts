import { Controller, Get } from '@nestjs/common';
import { CrawlingService } from './crawling.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('crawling')
@ApiTags('크롤링')
export class CrawlingController {
  constructor(private readonly crawlingService: CrawlingService) {}

  @Get()
  @ApiOperation({ summary: '크롤링 데이터 조회' })
  @ApiResponse({
    description: '크롤링 데이터 조회 성공',
    type: Object,
    schema: {
      type: 'object',
      properties: {}
    }
  })
  async getCrawlData() {
    return this.crawlingService.getCrawlData();
  }
}
