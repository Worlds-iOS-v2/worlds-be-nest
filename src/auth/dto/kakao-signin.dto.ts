import { IsBoolean, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KakaoSignInDto {
    @ApiProperty({
        description: '카카오 인증 응답 코드',
        example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz'
    })
    @IsString()
    kakaoAuthResCode: string;

    @ApiPropertyOptional({
        description: '목표 언어',
        example: 'ko',
        enum: ['ko', 'en', 'ja', 'zh']
    })
    @IsString()
    @IsOptional()
    targetLanguage: string;

    @ApiPropertyOptional({
        description: '멘토 여부',
        example: true,
        default: false
    })
    @IsBoolean()
    @IsOptional()
    isMentor: boolean;
}