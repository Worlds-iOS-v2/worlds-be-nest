import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
      await this.$executeRaw`SET TIME ZONE 'Asia/Seoul'`;
      console.log('Prisma 연결 완료');
    } catch (err) {
      console.error('Prisma 초기화 실패:', err);
      // process.exit(1); // 혹은 부팅은 유지하고자 하면 이 줄 제거
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma 연결이 종료되었습니다.');
  }
}
