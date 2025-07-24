import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class CheckEmailDto {
    @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
    @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
    @ApiProperty({
        description: 'email of the user : unique, not null',
        example: 'user@example.com'
    })
    userEmail: string;
}