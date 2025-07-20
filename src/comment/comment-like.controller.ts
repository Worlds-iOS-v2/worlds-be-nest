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
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id')
  @ApiOperation({ summary: '댓글 좋아요' })
  async commentLike(@Request() req, @Param('id') commentId: string) {
    const userId = 1; // 임시로 userId
    return this.commentLikeService.commentLike(userId, Number(commentId)); // 나중에 userId를 req.user.id로 바꾸기
  }

  // 댓글별 좋아요 수 조회
  // @UseGuards(JwtAuthGuard)
  @Get(':id/count')
  @ApiOperation({ summary: '댓글별 좋아요 수' })
  async commentLikeCount(@Param('id') commentId: string) {
    return this.commentLikeService.commentLikeCount(Number(commentId));
  }

  // comment-like.controller.ts
  // @UseGuards(JwtAuthGuard)
  @Get(':id/isLiked')
  @ApiOperation({ summary: '해당 댓글을 현재 유저가 좋아요 눌렀는지 여부' })
  @ApiBearerAuth()
  async isLiked(@Request() req, @Param('id') commentId: string) {
    const userId = 1; // 추후 req.user.id로 교체
    return this.commentLikeService.isLiked(userId, Number(commentId));
  }

  // 좋아요 취소
  // @UseGuards(JwtAuthGuard)
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
