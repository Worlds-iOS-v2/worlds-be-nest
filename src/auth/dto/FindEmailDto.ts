import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class FindEmailDto {
    @IsString()
    @IsNotEmpty({ message: '이름은 필수 입력 항목입니다.' })
    @ApiProperty({
        description: 'name of the user : not null',
        example: '이건희',
    })
    userName: string;
}