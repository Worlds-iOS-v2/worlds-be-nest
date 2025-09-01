import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class KakaoSignUpDto {
    @ApiProperty({
        description: '카카오 사용자 ID',
        example: '1234567890'
    })
    @IsString()
    kakaoId: string;

    @ApiProperty({
        description: '카카오 프로필 정보',
        example: {
            nickname: '홍길동',
            profile_image_url: 'https://k.kakaocdn.net/dn/example.jpg',
            thumbnail_image_url: 'https://k.kakaocdn.net/dn/example_thumb.jpg'
        }
    })
    profile: any;

    @ApiProperty({
        description: '멘토 여부',
        example: true
    })
    @IsBoolean()
    isMentor: boolean;

    @ApiProperty({
        description: '목표 언어',
        example: 'ko',
        enum: ['ko', 'en', 'ja', 'zh']
    })
    @IsString()
    targetLanguage: string;
}