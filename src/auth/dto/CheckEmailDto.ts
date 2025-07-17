import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CheckEmailDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'email of the user : unique, not null',
        example: 'user@example.com',
    })
    userEmail: string;
}