import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/CreateUserDto';
import { CheckEmailDto } from './dto/CheckEmailDto';
import { SignInDto } from './dto/SignInDto';
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

}
