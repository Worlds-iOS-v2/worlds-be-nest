import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class SignInDto {

    @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
    @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
    @ApiProperty({
        description: 'email of the user : unique, not null',
        example: 'user@example.com',
    })
    userEmail: string;

    @IsString()
    @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
    @ApiProperty({
        description: 'password of the user : not null',
        example: 'password123!',
    })
    @Matches(
      /^(?!^[a-zA-Z]+$)(?!^[0-9]+$)(?!^[^a-zA-Z0-9]+$)[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{8,16}$/,
      {
        message:
          '비밀번호는 영문, 숫자, 특수문자 중 2가지 이상 조합으로 8~16자여야 합니다.',
      },
    )
    password: string;
}