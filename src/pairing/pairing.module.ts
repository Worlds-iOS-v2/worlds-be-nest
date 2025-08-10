import { Module } from '@nestjs/common';
import { PairingController } from './pairing.controller';
import { PairingService } from './pairing.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatService } from 'src/chat/chat.service';
import { AzureStorageService } from 'src/common/azure-storage/azure-storage.service';

@Module({
  controllers: [PairingController],
  providers: [PairingService, PrismaService, ChatService, AzureStorageService],
  exports: [PairingService],
})
export class PairingModule {}
