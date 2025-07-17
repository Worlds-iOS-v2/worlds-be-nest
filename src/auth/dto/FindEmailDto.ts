import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class FindEmailDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'name of the user : not null',
        example: '이건희',
    })
    userName: string;
}