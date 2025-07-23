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
import { CommentService } from './comment.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateReplyCommentDto } from './dto/create-reply-comment.dto';

@Controller('comment')
@ApiTags('comment')
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 답변 작성
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('question/:id')
  @ApiOperation({ summary: '질문에 대한 첫 댓글 작성' })
  async createComment(
    @Request() req,
    @Param('id') questionId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.createComment(
      req.user.id,
      Number(questionId),
      dto,
    );
  }

  // 대댓글 작성
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/reply')
  @ApiOperation({ summary: '댓글 하나에 대한 대댓글 작성' })
  async createReplyComment(
    @Request() req,
    @Param('id') parentId: string,
    @Body() dto: CreateReplyCommentDto,
  ) {
    return this.commentService.createReplyComment(
      req.user.id,
      Number(parentId),
      dto,
    );
  }

  // 게시글별 답변 조회
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('question/:id')
  @ApiOperation({ summary: '게시글별 답변 조회' })
  async getCommentsByQuestion(@Param('id') questionId: number) {
    const questionIdNum = Number(questionId);
    if (isNaN(questionIdNum)) {
      throw new BadRequestException('Invalid question id');
    }
    return this.commentService.getCommentsByQuestion(questionIdNum);
  }

  // 내가 쓴 모든 댓글 조회
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my/comments')
  @ApiOperation({ summary: '내가 작성한 모든 댓글 목록' })
  async getMyComments(@Request() req) {
    return this.commentService.getMyComments(req.user.id);
  }

  // 댓글 신고
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/report')
  @ApiOperation({ summary: '댓글 신고' })
  async reportComment(
    @Param('id') commentId: string,
    @Body() dto: CreateReportDto,
    @Request() req,
  ) {
    return this.commentService.reportComment(
      Number(commentId),
      dto,
      req.user.id,
    );
  }

  // 댓글 삭제 (soft-delete)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: '댓글 삭제 (soft-delete)' })
  async deleteComment(@Param('id') id: string, @Request() req) {
    const commentId = Number(id);
    if (isNaN(commentId)) {
      throw new BadRequestException('Invalid comment id');
    }

    await this.commentService.deleteComment(commentId, req.user.id);
    return { message: '댓글이 삭제되었습니다 (soft-delete)' };
  }
}
