import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppleSigninDto {
  @ApiProperty({
    description: 'Apple OAuth ID',
    example: '000123.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz'
  })
  @IsString()
  oauthId: string;

  @ApiProperty({
    description: 'Apple ID Token',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  idToken: string;

  @ApiPropertyOptional({
    description: '사용자 이메일 (첫 로그인시에만)',
    example: 'user@example.com'
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: '사용자 이름 (첫 로그인시에만)',
    example: '홍길동'
  })
  @IsOptional()
  @IsString()
  givenName?: string;

  @ApiPropertyOptional({
    description: '사용자 성 (첫 로그인시에만)',
    example: '김'
  })
  @IsOptional()
  @IsString()
  familyName?: string;

  @ApiProperty({
    description: '목표 언어',
    example: 'ko',
    enum: ['ko', 'en', 'ja', 'zh']
  })
  @IsString()
  targetLanguage: string;
}