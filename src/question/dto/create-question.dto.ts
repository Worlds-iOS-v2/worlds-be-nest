import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Category } from 'src/common/enums/category.enum';

export class CreateQuestionDto {
  @IsNotEmpty()
  @ApiProperty({ description: '게시글 제목', example: '게시글 제목' })
  title: string;

  @IsNotEmpty()
  @ApiProperty({ description: '카테고리', example: 'study', enum: Category })
  category: Category;

  @IsNotEmpty()
  @ApiProperty({ description: '게시글 내용', example: '게시글 내용' })
  content: string;
}
