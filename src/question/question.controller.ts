import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionDto } from './dto/list-question.dto';
import { Category } from 'src/common/enums/category.enum';
import { ResponseQuesitonDto } from './dto/detail-question.dto';
import { ReportDto } from './dto/report-question.dto';

@ApiTags('질문 게시판')
@Controller('questions')
// @ApiBearerAuth()
export class QuestionController {
    constructor(private readonly questionService: QuestionService) {}

    //질문 등록
    @Post()
    // @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '질문 등록', description: '새로운 질문을 등록합니다.' })
    async createQuestion(
        @Body() createQuestionDto: CreateQuestionDto, 
        // @Request() req,
    ) {
    const userId = 1; //req.user.id;
    return await this.questionService.createQuestion(createQuestionDto, userId);
    }

    //질문 리스트
    @Get()
    @ApiOperation({ summary: '질문 목록 조회', description: '카테고리별로 질문 목록을 조회합니다.' })
    @ApiQuery({ name: 'category', required: false, enum: Category })
    @ApiResponse({ status: 200, type: [ListQuestionDto] })
    async getQuestions(@Query('category') category?: Category) {
     return await this.questionService.getQuestionList(category);
 }


    //질문 상세 조회
    @Get(':id')
    @ApiOperation({ summary: '질문 상세 조회', description: '특정 질문의 상세 정보를 조회합니다.' })
    @ApiResponse({ status: 200, type: ResponseQuesitonDto })
    async getQuestionDetail(@Param('id', ParseIntPipe) id: number) {
        return await this.questionService.getQuestionDetail(id);
    }

    //질문 삭제
    @Delete(':id')
    @ApiOperation({ summary: '질문 삭제', description: '질문(게시글)을 삭제합니다.' })
    async deleteQuestion(@Param('id', ParseIntPipe) id: number) {
        const userId = 1; //req.user.id;
        return await this.questionService.deleteQuestion(id, userId);
    }

    //질문 신고
    @Post(':id/report')
    // @UseGuards(AuthGuard)
    // @ApiBearerAuth()
    async reportQuestion(
    @Param('id', ParseIntPipe) questionId: number,
    @Body() reportDto: ReportDto,
    // @Request() req
    ) {
    const userId = 1; //req.user.id;
    return this.questionService.reportQuestion(questionId, userId, reportDto); //(questionId, req.user.id, dto);
    }
    
    


}
