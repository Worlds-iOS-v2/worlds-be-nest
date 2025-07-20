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

@Controller('comment')
@ApiTags('comment')
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 답변 작성
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('question/:id')
  @ApiOperation({ summary: '질문에 대한 첫 답변 작성' })
  async createComment(
    @Request() req,
    @Param('id') questionId: string,
    @Body() dto: CreateCommentDto,
  ) {
    const userId = 1; // 임시로 유저 ID
    return this.commentService.createComment(
      userId, // req.user.id 나중에 이걸로 바꾸기
      Number(questionId),
      dto,
    );
  }

  // 대댓글 작성
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/reply')
  @ApiOperation({ summary: '답변 하나에 대한 대댓글 작성' })
  async createReplyComment(
    @Request() req,
    @Param('id') parentId: string,
    @Body() dto: CreateCommentDto,
  ) {
    const userId = 1; // 임시로 유저 ID
    return this.commentService.createReplyComment(
      userId, // req.user.id 나중에 이걸로 바꾸기
      Number(parentId),
      dto,
    );
  }

  // 게시글별 답변 조회
  // @UseGuards(JwtAuthGuard)
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
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my/comments')
  @ApiOperation({ summary: '내가 작성한 모든 댓글 목록' })
  async getMyComments(@Request() req) {
    return this.commentService.getMyComments(req.user.id);
  }

  // 댓글 삭제
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: '댓글 삭제' })
  async deleteComment(@Param('id') id: string, @Request() req) {
    const userId = 1;
    return this.commentService.deleteComment(Number(id), userId); // 나중에 userId를 req.user.id로 바꾸기
  }
}
