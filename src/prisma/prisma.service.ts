import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // 임시로 데이터베이스 연결 비활성화
    await this.$connect();
    console.log('Prisma 연결 완료');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma 연결이 종료되었습니다.');
  }
}
