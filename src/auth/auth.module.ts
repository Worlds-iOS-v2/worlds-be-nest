import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UserModule } from '../user/user.module';
import { MailingModule } from '../mailing/mailing.module';
import { CacheConfigModule } from '../cache/cache.module';

@Module({
  imports: [
    UserModule,
    MailingModule,
    CacheConfigModule,
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
