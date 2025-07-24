import { ApiProperty } from '@nestjs/swagger';
import { Category } from 'src/common/enums/category.enum';

export class ListQuestionDto {

  @ApiProperty({ description: '질문 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '카테고리', example: 'study', enum: Category })
  category: Category;

  @ApiProperty({ description: '게시글 제목', example: '게시글 제목' })
  title: string;

  @ApiProperty({ description: '게시글 내용', example: '게시글 내용' })
  content: string;

  @ApiProperty({ description: '생성일자', example: '2024-07-23T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '답변 여부', example: false })
  isAnswered: boolean;

  @ApiProperty({ description: '답변 개수', example: 2 })
  answerCount: number;
  
}
