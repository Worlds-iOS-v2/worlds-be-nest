import { ApiProperty } from "@nestjs/swagger";

export class RequestResetPasswordDto {
    @ApiProperty({
        example: 'user@example.com',
        description: '비밀번호 찾기 요청할 이메일'
    })
    email: string;
}