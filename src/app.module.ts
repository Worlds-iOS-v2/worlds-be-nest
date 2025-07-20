import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommentModule } from './comment/comment.module';
import { CommentLikeModule } from './comment/comment-like.module';

@Module({
  imports: [PrismaModule, CommentModule, CommentLikeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
