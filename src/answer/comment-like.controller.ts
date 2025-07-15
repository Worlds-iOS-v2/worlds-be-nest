import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  BadRequestException,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentLikeService } from './comment-like.service';

@Controller('comment/like')
@ApiTags('like')
@ApiBearerAuth()
export class CommentLikeController {
  constructor(private readonly commentLikeService: CommentLikeService) {}

  // 댓글 좋아요
  @UseGuards()
  @ApiBearerAuth()
  @Post(':id')
  @ApiOperation({ summary: '댓글 좋아요' })
  async commentLike(@Request() req, @Param('id') commentId: string) {
    return this.commentLikeService.commentLike(req.user.id, Number(commentId));
  }

  // 좋아요 취소
  @UseGuards()
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: '댓글 좋아요 취소' })
  async deleteLike(@Request() req, @Param('id') commentId: string) {
    return this.commentLikeService.commentUnlike(
      req.user.id,
      Number(commentId),
    );
  }
}
