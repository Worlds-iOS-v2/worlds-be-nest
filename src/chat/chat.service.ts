import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AzureStorageService } from 'src/common/azure-storage/azure-storage.service';
import { Express } from 'express';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private azureStorageService: AzureStorageService,
    private userService: UserService,
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

  // 채팅방 목록 + 안 읽은 메시지 수 포함
  async getUserChatRoomsWithUnread(userId: number) {
    // 1) 내가 속한 방들 + 마지막 메시지 포함 조회 (숨김 방 제외)
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        OR: [
          { userAId: userId, isHiddenForUserA: false },
          { userBId: userId, isHiddenForUserB: false },
        ],
      },
      include: {
        userA: { select: { id: true, userName: true } },
        userB: { select: { id: true, userName: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (rooms.length === 0) return [] as Array<any>;

    const roomIds = rooms.map(r => r.id);

    // 2) 각 방의 unreadCount 계산 (내가 보낸 메시지 제외, isRead = false)
    const unreadGroups = await this.prisma.message.groupBy({
      by: ['roomId'],
      where: {
        roomId: { in: roomIds },
        isRead: false,
        senderId: { not: userId },
      },
      _count: { _all: true },
    });

    const unreadMap = new Map<number, number>();
    for (const g of unreadGroups) unreadMap.set(g.roomId, g._count._all);

    // 3) 결과 합치기
    return rooms.map((r) => ({
      ...r,
      unreadCount: unreadMap.get(r.id) ?? 0,
    }));
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

  // 메시지 신고
  // reporterId: 신고한 사용자 ID (JWT에서 추출)
  // messageId: 신고 대상 메시지 ID
  // reason: ReportReason(enum) 문자열 값 (e.g. 'offensive' | 'sexual' | 'ad' | 'etc')
  async reportMessage(reporterId: number, messageId: number, reason: string) {
    // 대상 메시지 존재 여부 확인
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    // 자기 자신의 메시지는 신고 불가로 막으려면 아래 주석 해제
    if (msg.senderId === reporterId) {
      throw new BadRequestException('자신이 보낸 메시지는 신고할 수 없습니다.');
    }

    // 메시지 작성자의 신고 횟수 증가
    const message = await this.prisma.message.findUnique({
      where: {id: messageId},
      select: {senderId: true}
    })

    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    const updatedUser = await this.prisma.users.update({
      where: {id: message.senderId},
      data: {
        reportCount: {
          increment: 1,
        },
      },
    })

    // 10회 이상이면 차단
    if (updatedUser.reportCount >= 10) {
      await this.userService.blockUser(message.senderId);
    }

    return this.prisma.report.create({
      data: {
        reporterId,
        messageId,
        reason: reason as any, // Prisma enum ReportReason과 동일 문자열 사용
        etcReason: null,       // 현재 DTO에서는 etcReason 미사용
      },
    });
  }

  // 여러 메시지를 읽음 처리 (내가 보낸 메시지는 제외)
  async markMessagesAsRead(userId: number, messageIds: number[]) {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return { count: 0 };
    }

    return this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        senderId: { not: userId },
      },
      data: { isRead: true },
    });
  }

  // 방 기준 여러 메시지 읽음 처리 + 마지막 읽은 메시지 포인터 갱신
  async markMessagesAsReadInRoom(roomId: number, userId: number, messageIds: number[]) {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return { count: 0, lastReadMessageId: null };
    }

    // 1) 방 검증 및 참여자 확인
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        userAId: true,
        userBId: true,
        lastReadMessageIdByA: true,
        lastReadMessageIdByB: true,
      },
    });
    if (!room) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }
    const isUserA = room.userAId === userId;
    const isUserB = room.userBId === userId;
    if (!isUserA && !isUserB) {
      throw new BadRequestException('해당 채팅방의 참여자가 아닙니다.');
    }

    // 2) 해당 방의 지정 메시지들만 읽음 처리 (내가 보낸 메시지는 제외)
    const updateResult = await this.prisma.message.updateMany({
      where: {
        roomId,
        id: { in: messageIds },
        senderId: { not: userId },
      },
      data: { isRead: true },
    });

    // 3) 마지막 읽은 메시지 포인터 갱신 (최댓값 사용, 기존 값보다 작은 경우는 유지)
    const maxId = Math.max(...messageIds);
    let newPointer = maxId;

    if (isUserA) {
      const keep = room.lastReadMessageIdByA ?? 0;
      newPointer = keep > maxId ? keep : maxId;
      await this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { lastReadMessageIdByA: newPointer },
      });
    } else if (isUserB) {
      const keep = room.lastReadMessageIdByB ?? 0;
      newPointer = keep > maxId ? keep : maxId;
      await this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { lastReadMessageIdByB: newPointer },
      });
    }

    return { count: updateResult.count, lastReadMessageId: newPointer };
  }
  // === 방 나가기(숨김) ===
  async leaveRoom(userId: number, roomId: number) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, userAId: true, userBId: true, isHiddenForUserA: true, isHiddenForUserB: true },
    });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');

    if (room.userAId === userId) {
      if (room.isHiddenForUserA) return { roomId, hiddenFor: 'A', alreadyHidden: true };
      await this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { isHiddenForUserA: true },
      });
      return { roomId, hiddenFor: 'A', alreadyHidden: false };
    }

    if (room.userBId === userId) {
      if (room.isHiddenForUserB) return { roomId, hiddenFor: 'B', alreadyHidden: true };
      await this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { isHiddenForUserB: true },
      });
      return { roomId, hiddenFor: 'B', alreadyHidden: false };
    }

    throw new BadRequestException('해당 채팅방의 참여자가 아닙니다.');
  }

  // === 숨김 해제 ===
  async unhideRoom(userId: number, roomId: number) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, userAId: true, userBId: true, isHiddenForUserA: true, isHiddenForUserB: true },
    });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');

    if (room.userAId === userId) {
      if (!room.isHiddenForUserA) return { roomId, unhiddenFor: 'A', alreadyVisible: true };
      await this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { isHiddenForUserA: false },
      });
      return { roomId, unhiddenFor: 'A', alreadyVisible: false };
    }

    if (room.userBId === userId) {
      if (!room.isHiddenForUserB) return { roomId, unhiddenFor: 'B', alreadyVisible: true };
      await this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { isHiddenForUserB: false },
      });
      return { roomId, unhiddenFor: 'B', alreadyVisible: false };
    }

    throw new BadRequestException('해당 채팅방의 참여자가 아닙니다.');
  }
}