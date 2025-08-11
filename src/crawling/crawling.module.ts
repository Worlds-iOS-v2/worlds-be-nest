import { Module } from '@nestjs/common';
import { CrawlingService } from './crawling.service';
import { CrawlingController } from './crawling.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  controllers: [CrawlingController],
  providers: [
    CrawlingService,
    SchedulerService,
  ],
})
export class CrawlingModule {}
