import { Controller, Get, Param, Query } from '@nestjs/common';
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

  // 채팅방 입장 -> 메세지 상세 내용
  @Get('messages/:roomId')
  @ApiParam({ name: 'roomId', type: Number })
  async getRoomMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ) {
    return this.chatService.getMessagesDetail(roomId, take, skip);
  }


}