import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ResetPasswordDto {
    @IsEmail()
    @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
    @ApiProperty({
        description: 'email of the user : not null',
        example: 'user@example.com',
    })
    email: string;

    @IsString()
    @IsNotEmpty({ message: '새로운 비밀번호는 필수 입력 항목입니다.' })
    @ApiProperty({
        description: 'new password of the user : not null',
        example: 'newpassword123',
    })
    newPassword: string;
}