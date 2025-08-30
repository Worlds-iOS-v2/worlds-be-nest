import { IsString, IsOptional } from 'class-validator';

export class AppleSigninDto {
  @IsString()
  oauthId: string;

  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  email?: string; // 첫 로그인시에만

  @IsOptional()
  @IsString()
  givenName?: string; // 첫 로그인시에만

  @IsOptional()
  @IsString()
  familyName?: string; // 첫 로그인시에만

  @IsString()
  targetLanguage: string;
}