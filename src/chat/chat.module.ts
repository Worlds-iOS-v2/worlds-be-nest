import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatController } from './chat.controller';

@Module({
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PrismaService]
})
export class ChatModule {}
