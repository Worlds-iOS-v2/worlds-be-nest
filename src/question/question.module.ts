import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AzureStorageModule } from 'src/common/azure-storage/azure-storage.module';

@Module({
  imports: [PrismaModule, AzureStorageModule],
  providers: [QuestionService],
  controllers: [QuestionController]
})
export class QuestionModule {}
