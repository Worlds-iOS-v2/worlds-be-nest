import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CacheConfigModule as CacheModule } from './cache/cache.module';
import { MailingModule } from './mailing/mailing.module';

@Module({
  imports: [UserModule, AuthModule, CacheModule, MailingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
