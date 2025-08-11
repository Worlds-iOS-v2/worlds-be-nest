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

  // 전체 목록 형식이랑 동일시(작성자 정보 추가 -> 리팩토링시 삭제)
  @ApiProperty({
    description: '작성자 정보',
    example: {
      id: 1,
      user_name: 'ohaii',
      user_email: 'o@example.com',
      user_role: true,
    },
  })
  user: {
    id: number;
    user_name: string;
    user_email: string;
    user_role: boolean;
  };
  //
  
}
