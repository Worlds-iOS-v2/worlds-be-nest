import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, Patch, Req, Delete, UseInterceptors, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/CreateUserDto';
import { SignInDto } from './dto/SignInDto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePasswordDto } from './dto/UpdatePasswordDto';
import { FindEmailDto } from './dto/FindEmailDto';
import { CheckEmailDto } from './dto/CheckEmailDto';
import { DeleteUserDto } from './dto/DeleteUserDto';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { HttpExceptionFilter } from 'src/common/interceptor/http-exception.filter';
import { VerifyCodeDto } from './dto/VerifyCodeDto';
import { ResetPasswordDto } from './dto/ChangePasswordDto';

@ApiTags('사용자')
@Controller('auth')
@UseInterceptors(ResponseInterceptor)
@UseFilters(HttpExceptionFilter)
@ApiBearerAuth()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // 회원가입
  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 200, description: '회원가입 성공' })
  async signUp(@Body() signupForm: CreateUserDto) {
    return this.authService.signUp(signupForm);
  }

  // 이메일 중복확인
  @Post('email/check-unique')
  @ApiOperation({ summary: '이메일 중복 확인' })
  @ApiResponse({ status: 200, description: '사용 가능한 이메일입니다.' })
  async checkEmail(@Body() checkEmailDto: CheckEmailDto) {
    return this.authService.checkEmailAndSendVerification(checkEmailDto.userEmail);
  }

  // 로그인
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  async signIn(@Body() signinForm: SignInDto) {
    return this.authService.signIn(signinForm);
  }

  // 로그아웃
  @Post('signout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.authService.logout(userId);
  }

  // 리프레시 토큰 있으면 액세스 토큰 재발급해줌
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

  // 유저 정보 가져오기
  @UseGuards(JwtAuthGuard)
  @Get('userinfo')
  @ApiOperation({ summary: '사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  async getUserInfo(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.authService.getUserInfo(userId);
  }

  // 로그인 상태에서 비밀번호 변경
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @ApiOperation({ summary: '마이페이지에서 비밀번호 변경' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  async changePassword(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    const updatePasswordDto = req.body as UpdatePasswordDto;
    return this.authService.updatePassword(userId, updatePasswordDto);
  }

  // 이메일 찾기
  @Post('email/find-by-name')
  @ApiOperation({ summary: '이메일 찾기' })
  @ApiResponse({ status: 200, description: '이메일 찾기 성공' })
  async findEmail(@Body() findEmailDto: FindEmailDto) {
    return this.authService.findEmail(findEmailDto);
  }

  @Delete('delete-user')
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 200, description: '회원 탈퇴 성공' })
  @ApiBody({ type: DeleteUserDto })
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.authService.deactivateUser(userId, req.body as DeleteUserDto);
  }

  // 비밀번호 찾기 요청
  @Post('password/reset-request')
  @ApiOperation({ summary: '로그인 화면에서 비밀번호 찾기 요청' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'user@example.com',
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: '비밀번호 찾기 성공' })
  async findPassword(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  // 비밀번호 찾기 요청 수락 > 변경
  @Post('password/reset')
  @ApiOperation({ summary: '로그인 화면에서 비밀번호 재설정' })
  @ApiResponse({ status: 200, description: '비밀번호 재설정 성공' })
  async resetPassword(@Body() resetpasswordform: ResetPasswordDto) {
    return this.authService.changePassword(resetpasswordform);
  }

  // 인증코드 확인
  @Post('email/verify-code')
  @ApiOperation({ summary: '이메일 인증 코드 확인' })
  @ApiResponse({ status: 200, description: '인증 코드 확인 성공' })
  async checkCode(@Body() verifycodeform: VerifyCodeDto) {
    return this.authService.verifyCode(verifycodeform);
  }

  // 출석 체크
  @Post('attendance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '출석 체크' })
  @ApiResponse({ status: 200, description: '출석 체크 성공' })
  async checkAttendance(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.authService.checkAttendance(userId);
  }

  // 출석 체크 조회 - 일~월
  @Get('attendance-dates')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '출석 일자 조회' })
  @ApiResponse({ status: 200, description: '출석 일자 조회 성공' })
  async getAttendanceDates(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.authService.getAttendanceDates(userId);
  }
}
