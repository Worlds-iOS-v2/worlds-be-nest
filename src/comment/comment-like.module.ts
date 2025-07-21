import { Module } from '@nestjs/common';
import { CommentLikeController } from './comment-like.controller';
import { CommentLikeService } from './comment-like.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentLikeController],
  providers: [CommentLikeService],
})
export class CommentLikeModule {}
