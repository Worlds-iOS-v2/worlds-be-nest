import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionModule } from './question/question.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
    }), UserModule, AuthModule, PrismaModule, QuestionModule],
    
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}