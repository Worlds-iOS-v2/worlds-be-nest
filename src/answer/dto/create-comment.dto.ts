import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @ApiProperty({ description: '답변 내용', example: '답변 내용' })
  content: string;
}
