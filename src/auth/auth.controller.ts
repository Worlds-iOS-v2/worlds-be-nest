import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/CreateUserDto';
import { CheckEmailDto } from './dto/CheckEmailDto';
import { SignInDto } from './dto/SignInDto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserService } from 'src/user/user.service';
import { Request as ExpressRequest } from 'express';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  // User signup endpoint
  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 200, description: '회원가입 성공' })
  async signUp(@Body() signupForm: CreateUserDto) {
    return this.authService.signUp(signupForm);
  }

  // check email endpoint
  @Post('check-email')
  @ApiOperation({ summary: '이메일 중복 확인' })
  @ApiResponse({ status: 200, description: '사용 가능한 이메일입니다.' })
  async checkEmail(@Body() checkEmailDto: CheckEmailDto) {
    return this.authService.checkEmailUnique(checkEmailDto.userEmail);
  }

  // signin endpoint
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  async signIn(@Body() signinForm: SignInDto) {
    return this.authService.signIn(signinForm);
  }

  // refresh token endpoint
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '액세스 토큰 재발급' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: '액세스 토큰 재발급 성공' })
  async getNewRefreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.validateRefreshToken(refreshToken);
  }

  // logout endpoint
  @Get('signout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃' })
  @ApiHeader({
    name: 'Authorization',
    description: '액세스 토큰 값 입력, EX) Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Request() req: ExpressRequest) {
    const userId = (req.user as any).sub;
    return this.authService.logout(userId);
  }

  // get user info endpoint
  @UseGuards(JwtAuthGuard)
  @Get('userinfo')
  @ApiOperation({ summary: '사용자 정보 조회' })
  @ApiHeader({
    name: 'Authorization',
    description: '액세스 토큰 값 입력, EX) Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  async getUserInfo(@Request() req: ExpressRequest) {
    const userId = (req.user as any).sub;
    return this.authService.getUserInfo(userId);
  }

}
