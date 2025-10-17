import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatController } from './chat.controller';
import { UserModule } from 'src/user/user.module';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [UserModule, UtilsModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PrismaService]
})
export class ChatModule {}
