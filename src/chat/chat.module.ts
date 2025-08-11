import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatController } from './chat.controller';
import { AzureStorageModule } from 'src/common/azure-storage/azure-storage.module';

@Module({
  imports: [AzureStorageModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PrismaService]
})
export class ChatModule {}
