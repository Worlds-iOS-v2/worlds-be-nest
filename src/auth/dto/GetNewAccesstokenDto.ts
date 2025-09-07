import { ApiProperty } from "@nestjs/swagger";

export class GetNewAccesstokenDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: '재발급 받을 때 필요한 리프레시 토큰'
    })
    refreshToken: string;
}