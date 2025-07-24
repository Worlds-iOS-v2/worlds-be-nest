import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class UpdatePasswordDto {
    @IsString({ message: '기존 비밀번호는 문자열 형식이어야 합니다.' })
    @IsNotEmpty({ message: '기존 비밀번호는 필수 입력 항목입니다.' })
    @ApiProperty({
        description: 'original password of the user : not null',
        example: 'password123',
    })
    org_password: string;

    @IsString({ message: '새 비밀번호는 문자열 형식이어야 합니다.' })
    @IsNotEmpty({ message: '새 비밀번호는 필수 입력 항목입니다.' })
    @Matches(
      /^(?!^[a-zA-Z]+$)(?!^[0-9]+$)(?!^[^a-zA-Z0-9]+$)[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{8,16}$/,
      {
        message:
          '비밀번호는 영문, 숫자, 특수문자 중 2가지 이상 조합으로 8~16자여야 합니다.',
      },
    )
    @ApiProperty({
        description: 'new password of the user : not null',
        example: 'password321',
    })
    new_password: string;
}