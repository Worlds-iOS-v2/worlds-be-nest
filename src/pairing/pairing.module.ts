import { Module } from '@nestjs/common';
import { PairingController } from './pairing.controller';
import { PairingService } from './pairing.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatService } from 'src/chat/chat.service';
import { UserModule } from 'src/user/user.module';
import { AWSS3Service } from 'src/common/aws-s3/aws-s3.service';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [UserModule, UtilsModule],
  controllers: [PairingController],
  providers: [PairingService, PrismaService, ChatService, AWSS3Service],
  exports: [PairingService],
})
export class PairingModule {}
