import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  // imports: [PrismaModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class AnswerModule {}
