import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AzureStorageService } from 'src/common/azure-storage/azure-storage.service';

@Injectable()
export class ChatService {
    constructor(
        private prisma: PrismaService,
        private azureStorageService: AzureStorageService, 
    ) {}

    async saveMessage(data: CreateMessageDto, file?: Express.Multer.File) {
        let fileUrl = data.fileUrl || null;
        let fileType = data.fileType || null;

        // 파일이 첨부 -> Azure Storage
        if (file) {
            fileUrl = await this.azureStorageService.upload(file.buffer, file.originalname);
            fileType = file.mimetype;
        }

        return this.prisma.message.create({
            data: {
                roomId: data.roomId,
                senderId: data.senderId,
                content: data.content,
                fileUrl,
                fileType,
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
                userA: { select: { id: true, userName: true } },
                userB: { select: { id: true, userName: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });
    }

    // 채팅방 메시지 상세 조회(이전 대화 내용)
    async getMessagesDetail(roomId: number, take = 20, skip = 0) {
        return this.prisma.message.findMany({
            where: { roomId },
            orderBy: { createdAt: 'asc' },
            take,
            skip,
        });
    }
}