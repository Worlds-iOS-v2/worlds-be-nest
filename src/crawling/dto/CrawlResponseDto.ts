// crawling/dto/crawl-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CrawlResponseDto {
  @ApiProperty({ example: '크롤링 데이터 조회 성공' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        borough: { type: 'string', example: '서초구' },
        title: { type: 'string', example: '다문화 가족 지원 프로그램' },
        image: { type: 'string', example: 'https://example.com/image.jpg' },
        url: { type: 'string', example: 'https://example.com/program' },
        applicationPeriod: { type: 'string', example: '2025-01-01 ~ 2025-01-31' },
        programPeriod: { type: 'string', example: '2025-02-01 ~ 2025-03-31' },
        target: { type: 'string', example: '다문화가족' },
        personnel: { type: 'string', example: '50명' },
        programDetail: { type: 'string', example: '프로그램 상세 내용' },
        location: { type: 'string', example: '서초구 가족센터' }
      }
    }
  })
  governmentData: any[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        borough: { type: 'string', example: '성동구' },
        title: { type: 'string', example: '한국어 교육 프로그램' },
        image: { type: 'string', example: 'https://example.com/image.jpg' },
        applicationPeriod: { type: 'string', example: '2025-01-01 ~ 2025-01-31' },
        programPeriod: { type: 'string', example: '2025-02-01 ~ 2025-03-31' },
        location: { type: 'string', example: '성동구 가족센터' },
        url: { type: 'string', example: 'https://example.com/program' }
      }
    }
  })
  koreanData: any[];
}