import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from './chat.service';
import {
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 채팅방 목록 (JWT에서 사용자 식별(유저아이디 안받아도 됨))
  @Get('chatrooms')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 채팅방 목록 조회' })
  async getUserChatRooms(@Req() req: Request) {
    const user = req.user as any; // JwtStrategy.validate()가 반환한 객체
    return this.chatService.getUserChatRooms(Number(user.id));
  }

  // 채팅방 입장 -> 메세지 상세 내용 (페이지네이션)
  @Get('messages/:roomId')
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'roomId', type: Number })
  @ApiOperation({ summary: '채팅방 메시지 조회 (페이지네이션)' })
  async getRoomMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
  ) {
    return this.chatService.getMessagesDetail(roomId, take, skip);
  }


   // 파일 Azure Storage에 업로드 -> URL반환 -> 소켓 send_message에 포함
  @Post('attachments/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '채팅 첨부파일 업로드 (URL 반환)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.uploadAttachment(file);
  }
}