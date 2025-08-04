import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { ParseIntPipe } from '@nestjs/common';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 채팅방 목록
  @Get('chatrooms/:userId')
  @ApiParam({ name: 'userId', type: Number, example: 2 })
  async getUserChatRooms(@Param('userId', ParseIntPipe) userId: number) {
    return this.chatService.getUserChatRooms(userId);
  }
}