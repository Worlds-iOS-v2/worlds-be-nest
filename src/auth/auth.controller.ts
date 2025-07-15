import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/CreateUserDto';
import { CheckEmailDto } from './dto/CheckEmailDto';
import { SignInDto } from './dto/SignInDto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserService } from 'src/user/user.service';
import { Request as ExpressRequest } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  // User signup endpoint
  @Post('signup')
  async signUp(@Body() signupForm: CreateUserDto) {
    return this.authService.signUp(signupForm);
  }

  // check email endpoint
  @Post('check-email')
  async checkEmail(@Body() checkEmailDto: CheckEmailDto) {
    return this.authService.checkEmailUnique(checkEmailDto.userEmail);
  }

  // signin endpoint
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signinForm: SignInDto) {
    return this.authService.signIn(signinForm);
  }

  // refresh token endpoint
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async getNewRefreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.validateRefreshToken(refreshToken);
  }

  // logout endpoint
  @Get('signout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: ExpressRequest) {
    const userId = (req.user as any).sub;
    return this.authService.logout(userId);
  }

  // get user info endpoint
  @UseGuards(JwtAuthGuard)
  @Get('userinfo')
  async getUserInfo(@Request() req: ExpressRequest) {
    const userId = (req.user as any).sub;
    return this.userService.findUserForUpdate(userId);
  }

}
