import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) {}

    async saveMessage(data: CreateMessageDto) {
        const { roomId, senderId, content } = data;

        // 메시지를 데이터베이스에 저장
        return this.prisma.message.create({
            data: {
                roomId,
                senderId,
                content,
            },
        });
    }



}
