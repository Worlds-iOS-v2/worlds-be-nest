import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '공부는 이렇게 하는 거예요!',
  })
  @IsNotEmpty({ message: '댓글 내용을 입력해주세요.' })
  content: string;
}
