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


  // REST로 파일 업로드 -> fileUrl, fileType 수신 -> 소켓 send_message에서 fileUrl만 포함해 메시지 전송
  async uploadAttachment(file: Express.Multer.File) {
    if (!file) {
      throw new Error('파일이 전달되지 않았습니다.');
    }

    const fileUrl = await this.azureStorageService.upload(
      file.buffer,
      file.originalname,
    );

    return {
      fileUrl,
      fileType: file.mimetype,
      fileName: file.originalname,
      size: file.size,
    };
  }


   // REST로도 메시지 저장 가능 (추가)
   // 소켓에서 fileUrl만 넘겨 받는 경우, file 사용ㄴㄴ
  async saveMessage(data: CreateMessageDto, file?: Express.Multer.File) {
    let fileUrl = data.fileUrl || null;
    let fileType = data.fileType || null;

    // 파일이 직접 첨부되어 온 경우(테스트/임시용) Azure Storage 업로드
    if (file) {
      fileUrl = await this.azureStorageService.upload(
        file.buffer,
        file.originalname,
      );
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
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, userName: true } },
        userB: { select: { id: true, userName: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }, // 마지막 메시지
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 채팅방 메시지 상세 조회(이전 대화 내용) - 페이지네이션
  async getMessagesDetail(roomId: number, take = 20, skip = 0) {
    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take,
      skip,
    });
  }
}