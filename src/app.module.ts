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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
