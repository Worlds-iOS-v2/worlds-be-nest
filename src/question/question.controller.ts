import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBody, ApiConsumes
} from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionDto } from './dto/list-question.dto';
import { Category } from 'src/common/enums/category.enum';
import { ResponseQuesitonDto } from './dto/detail-question.dto';
import { ReportDto } from './dto/report-question.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AWSS3Service } from 'src/common/aws-s3/aws-s3.service';
import { UtilsService } from 'src/common/utils/utils.service';


interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    id: number;
    username?: string;
    email?: string;
    isMentor?: boolean; //추가
  };
}

@ApiTags('질문 게시판')
@Controller('questions')
@ApiBearerAuth()
export class QuestionController {
  constructor(
    private readonly questionService: QuestionService,
    private readonly utilsService: UtilsService
  ) { }

  // 질문 생성
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '질문 등록', description: '새로운 질문을 등록합니다.' })
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return await this.questionService.createQuestion(createQuestionDto, userId);
  }

  // 질문 이미지 추가 등록
  @Post('with-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 3))
  @ApiOperation({ summary: '질문 등록(이미지 포함)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        category: { type: 'string', enum: Object.values(Category) },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async createQuestionWithImages(
    @Body() createDto: CreateQuestionDto,
    @UploadedFiles() files: any[],
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');

    const imageResults = await Promise.all(
      (files ?? []).map((f) => this.utilsService.imageUpload(userId, f)),
    );

    const urls = imageResults.map((r) => r.imageUrl);

    return this.questionService.createQuestion(createDto, userId, urls);

  }

  // 질문 리스트 조회
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '질문 목록 조회', description: '카테고리별로 질문 목록을 조회합니다.' })
  @ApiQuery({ name: 'category', required: false, enum: Category })
  @ApiResponse({ status: 200, type: [ListQuestionDto] })
  async getQuestions(@Query('category') category?: Category) {
    return await this.questionService.getQuestionList(category);
  }

  // 내가 쓴 질문 목록 조회
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내가 쓴 질문 목록 조회', description: '로그인한 사용자가 작성한 질문들을 조회합니다.' })
  @ApiResponse({ status: 200, type: [ListQuestionDto] })
  async getMyQuestions(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    if (!user?.id) throw new UnauthorizedException('로그인이 필요합니다.');

    const questions = await this.questionService.getMyQuestions(user.id);

    return questions.map((q) => ({
      ...q,
      user: {
        id: user.id,
        user_name: user.username,
        user_email: user.email,
        user_role: user.isMentor,
      },
    }));
  }

  // 질문 상세
  @Get(':id')
  @ApiOperation({ summary: '질문 상세 조회', description: '특정 질문의 상세 정보를 조회합니다.' })
  @ApiResponse({ status: 200, type: ResponseQuesitonDto })
  async getQuestionDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.questionService.getQuestionDetail(id);
  }

  // 질문 삭제
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '질문 삭제', description: '질문(게시글)을 삭제합니다.' })
  async deleteQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return await this.questionService.deleteQuestion(id, userId);
  }

  // 질문 신고
  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '질문 신고', description: '질문을 신고합니다.' })
  async reportQuestion(
    @Param('id', ParseIntPipe) questionId: number,
    @Body() reportDto: ReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return await this.questionService.reportQuestion(questionId, userId, reportDto);
  }


}