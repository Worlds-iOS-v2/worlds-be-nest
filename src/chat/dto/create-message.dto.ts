import { IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMessageDto {
  @Type(() => Number)
  @IsInt()
  roomId: number;

  @Type(() => Number)
  @IsInt()
  senderId: number;

  @IsString()
  content: string;
}