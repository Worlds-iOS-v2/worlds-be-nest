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
import { AzureStorageModule } from './azure-storage/azure-storage.module';
import { TranslateModule } from './translate/translate.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    PrismaModule,
    QuestionModule,
    CommentModule,
    CommentLikeModule,
    OcrModule,
    AzureStorageModule,
    TranslateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
