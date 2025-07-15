import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString, IsNotEmpty, IsEmail, Matches, IsDate, IsBoolean, IsOptional, IsInt, MinLength } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
    @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
    @Transform(({ value }) => value.trim())
    @ApiProperty({
        description: 'email of the user : unique, not null',
        example: 'user@example.com',
    })
    userEmail: string;

    @IsString()
    @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
    @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
    @ApiProperty({
        description: 'password of the user : not null',
        example: 'securePassword123',
    })
    @Matches(
      /^(?!^[a-zA-Z]+$)(?!^[0-9]+$)(?!^[^a-zA-Z0-9]+$)[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{8,16}$/,
      {
        message:
          '비밀번호는 영문, 숫자, 특수문자 중 2가지 이상 조합으로 8~16자여야 합니다.',
      },
    )
    passwordHash: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'name of the user : not null',
        example: '이건희',
    })
    userName: string;

    @Transform(({ value }) => new Date(value))
    @IsDate()
    @IsNotEmpty()
    @ApiProperty({
        description: 'birth date of the user : not null',
        example: '1990-01-01',
    })
    userBirth: Date;

    @IsBoolean()
    @IsNotEmpty()
    @ApiProperty({
        description: 'is the user a mentor? : not null',
        example: true,
    })
    isMentor: boolean;

    @IsOptional()
    @IsString()
    @Matches(
        /^(?!^[A-Z]+$)(?!^[0-9]+$)(?!^[^A-Z0-9]+$){6}$/,
        {
          message:
            '멘토 코드가 유효하지 않습니다. 6자의 대문자와 숫자 조합이어야 합니다.',
        },
      )
    @ApiProperty({
        description: 'allowed mentor code : optional',
        example: 'H23L4J',
        required: false,
    })
    mentorCode?: string;

    @IsOptional()
    @IsInt()
    @Transform(({ value }) => value || 0)
    @ApiProperty({
        description: 'reported count : default 0',
        example: 0,
        required: false,
    })
    reportedCount?: number = 0;
}
