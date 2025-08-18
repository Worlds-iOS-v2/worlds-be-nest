import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyCodeDto {
    @IsString()
    @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
    @ApiProperty({
        description: 'email of the user : not null',
        example: 'user@example.com',
    })
    email: string;

    @IsString()
    @IsNotEmpty({ message: '인증 코드는 필수 입력 항목입니다.' })
    @ApiProperty({
        description: 'verification code of the user : not null',
        example: '123344',
    })
    verificationCode: string;
}