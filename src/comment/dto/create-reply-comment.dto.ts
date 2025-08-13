import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateReplyCommentDto {
  @ApiProperty({
    description: '대댓글 내용',
    example: '맞아요, 이게 중요해요!',
  })
  @IsNotEmpty({ message: '대댓글 내용을 입력해주세요.' })
  content: string;
}
