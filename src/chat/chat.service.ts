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

    // 채팅방 목록 조회
    async getUserChatRooms(userId: number) {
        return this.prisma.chatRoom.findMany({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId },
                ],
            },
            include: {
                userA: {
                    select: { id: true, userName: true },
                },
                userB: {
                    select: { id: true, userName: true },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }

    // 채팅방 메시지 상세 조회(이전 대화 내용)
    async getMessagesDetail(roomId: number) {
    return this.prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
    });
}


}
