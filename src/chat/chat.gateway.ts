import {
  SubscribeMessage,         // 클라이언트가 보내는 이벤트 감지
  WebSocketGateway,
  OnGatewayConnection,      // 클라이언트 연결 이벤트 처리
  OnGatewayDisconnect,      // 클라이언트 연결 종료 이벤트 처리
  MessageBody,              // 메시지 내용 추출
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Express } from 'express';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  // 클라이언트가 연결되었을 때 호출됨
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // 클라이언트가 연결 종료되었을 때 호출됨
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // 클라이언트가 'join_room' 이벤트 보낼 때 실행
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId.toString()); // 소켓을 해당 room에 join 시킴
    console.log(`Client ${client.id} joined room ${data.roomId}`);
  }

  // 클라이언트가 'send_message' 이벤트를 보낼 때 실행됨
  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: CreateMessageDto & {
      fileBase64?: string; // 선택: base64 인코딩된 파일 데이터
      fileName?: string;   // 선택: 원본 파일명 (없으면 default 사용)
      mimeType?: string;   // 선택: mime 타입 (없으면 octet-stream)
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Message received:', data);

    let file: Express.Multer.File | undefined;

    // 파일(Base64)이 함께 온 경우 처리
    if (data.fileBase64) {
      // data URL 형태("data:image/png;base64,....")가 올 수 있으니 헤더 분리 처리
      const split = data.fileBase64.split(',');
      const base64Payload = split.length > 1 ? split[1] : split[0];
      const buffer = Buffer.from(base64Payload, 'base64');

      file = {
        fieldname: 'file',
        originalname: data.fileName || 'upload',
        encoding: '7bit',
        mimetype: data.mimeType || 'application/octet-stream',
        size: buffer.length,
        buffer,
        // 아래 속성들은 Multer 런타임에서만 사용되므로 게이트웨이에서는 생략 가능
        destination: undefined as any,
        filename: undefined as any,
        path: undefined as any,
        stream: undefined as any,
      } as unknown as Express.Multer.File;
    }

    // 1. 메시지 저장
    const savedMessage = await this.chatService.saveMessage(data, file);

    // 2. 상대방한테 메시지 전송
    client.broadcast
      .to(data.roomId.toString())
      .emit('receive_message', savedMessage);
  }

  // 클라이언트가 'read_message' 이벤트를 보낼 때 실행됨
  @SubscribeMessage('read_message')
  async handleReadMessage(
    @MessageBody()
    data: { roomId: number; messageIds: number[]; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Read message event received:', data);

    // 방 기준으로 읽음 처리 + 마지막 읽은 메시지 포인터 갱신
    const result = await this.chatService.markMessagesAsReadInRoom(
      data.roomId,
      data.userId,
      data.messageIds,
    );

    // 다른 클라이언트에게 읽음 처리 알림 (마지막 읽은 메시지 ID 포함)
    client.broadcast
      .to(data.roomId.toString())
      .emit('messages_read', {
        userId: data.userId,
        roomId: data.roomId,
        messageIds: data.messageIds,
        lastReadMessageId: result.lastReadMessageId,
      });

    // 호출자에게도 처리 결과를 응답으로 반환 (선택적 ack)
    return result;
  }
}