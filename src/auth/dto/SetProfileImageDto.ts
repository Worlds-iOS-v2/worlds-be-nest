import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class SetProfileImageDto {
    @ApiProperty({ example: 1, description: '이미지 번호(1~4)' })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(4)
    image: number
}