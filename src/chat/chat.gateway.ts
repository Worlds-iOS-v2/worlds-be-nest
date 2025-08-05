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
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Message received:', data);

    // 1. 메세지 저장
    const savedMessage = await this.chatService.saveMessage(data);

    // 2. 상대방한테 메시지 전송
    client.broadcast.to(data.roomId.toString()).emit('receive_message', savedMessage);
  }
}