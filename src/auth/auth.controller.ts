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

@ApiTags('사용자')
@Controller('auth')
@UseInterceptors(ResponseInterceptor)
@UseFilters(HttpExceptionFilter)
@ApiBearerAuth()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.authService.logout(userId);
  }

  // get user info endpoint
  @UseGuards(JwtAuthGuard)
  @Get('userinfo')
  @ApiOperation({ summary: '사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  async getUserInfo(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.authService.getUserInfo(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  async changePassword(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    const updatePasswordDto = req.body as UpdatePasswordDto;
    return this.authService.updatePassword(userId, updatePasswordDto);
  }

  @Post('find-email')
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

  @Get('attendance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '출석 체크' })
  @ApiResponse({ status: 200, description: '출석 체크 성공' })
  async checkAttendance(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.authService.checkAttendance(userId);
  }

  @Get('attendance-dates')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '출석 일자 조회' })
  @ApiResponse({ status: 200, description: '출석 일자 조회 성공' })
  async getAttendanceDates(@Request() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.authService.getAttendanceDates(userId);
  }
}
