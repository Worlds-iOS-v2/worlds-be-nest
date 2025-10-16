import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommentModule } from './comment/comment.module';
import { CommentLikeModule } from './comment/comment-like.module';
import { QuestionModule } from './question/question.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { OcrModule } from './ocr/ocr.module';
import { TranslateModule } from './translate/translate.module';
import { ChatModule } from './chat/chat.module';
import { CrawlingModule } from './crawling/crawling.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PairingModule } from './pairing/pairing.module';
import { BedrockModule } from './bedrock/bedrock.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    PrismaModule,
    QuestionModule,
    CommentModule,
    CommentLikeModule,
    TranslateModule,
    OcrModule,
    TranslateModule,
    ChatModule,
    CrawlingModule,
    PairingModule,
    BedrockModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}