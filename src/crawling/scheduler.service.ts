import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CrawlingService } from './crawling.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly crawlingService: CrawlingService,
    private readonly prismaService: PrismaService,
  ) { }

  @Cron('0 9 * * *')
  async scheduleCrawlGov() {
    const today = new Date();
    console.log('scheduleCrawling', today);
    const governmentData = await this.crawlingService.crawlerGovernmentProgram();
    console.log(governmentData);

    // 정부 프로그램 저장 -> 중복 저장 방지
    for (const data of governmentData) {
      try {
        // 같은 URL이 존재하는지 확인
        const existing = await this.prismaService.govPro.findFirst({
          where: {
            url: data.url,
          }
        })

        if (!existing) {
          await this.prismaService.govPro.create({
            data: data,
          })
          console.log(`새 정부 프로그램 저장: ${data.title}`);
        } else {
          console.log(`이미 존재하는 정부 프로그램: ${data.title}`);
        }
      } catch (error) {
        console.error(`정부 프로그램 저장 실패: ${data.title}`, error);
      }
    }
    console.log('스케줄러 실행 완료');
  }

  @Cron('0 9 * * 5')
  async scheduleCrawlKo() {
    const today = new Date();
    console.log('scheduleCrawling', today);
    const koreanData = await this.crawlingService.crawlerKoreanProgram();
    console.log(koreanData);

    // 한국어 교육 프로그램 저장 -> 중복 저장 방지
    for (const data of koreanData) {
      try {
        // 같은 URL이 존재하는지 확인
        const existing = await this.prismaService.koPro.findFirst({
          where: {
            url: data.url,
          }
        })

        if (!existing) {
          await this.prismaService.koPro.create({
            data: data,
          })
          console.log(`새 헌국어 교육 프로그램 저장: ${data.title}`);
        } else {
          console.log(`이미 존재하는 한국어 교육 프로그램: ${data.title}`);
        }
      } catch (error) {
        console.error(`한국어 교육 프로그램 저장 실패: ${data.title}`, error);
      }
    }
    console.log('스케줄러 실행 완료');
  }
}
