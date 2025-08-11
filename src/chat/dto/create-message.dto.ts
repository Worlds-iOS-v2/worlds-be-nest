import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMessageDto {
  @Type(() => Number)
  @IsInt()
  roomId: number;

  @Type(() => Number)
  @IsInt()
  senderId: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileType?: string;
}