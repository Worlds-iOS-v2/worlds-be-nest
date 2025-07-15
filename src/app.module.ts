import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
<<<<<<< HEAD
import { AuthModule } from './auth/auth.module';
import { CacheConfigModule as CacheModule } from './cache/cache.module';
import { MailingModule } from './mailing/mailing.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule, 
    AuthModule, 
    CacheModule, 
    MailingModule
  ],
=======
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [UserModule, PrismaModule],
>>>>>>> f454e6df826fbe004c3af4656c10f0456ea0a9d4
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
