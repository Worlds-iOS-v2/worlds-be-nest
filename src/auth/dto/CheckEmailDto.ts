import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class CheckEmailDto {
    @IsEmail()
    @ApiProperty({
        description: 'email of the user : unique, not null',
        example: 'user@example.com',
    })
    userEmail: string;
}
