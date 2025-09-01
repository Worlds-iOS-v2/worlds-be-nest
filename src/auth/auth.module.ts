import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { MAILER_OPTIONS, MailerModule, MailerService } from '@nestjs-modules/mailer';
import { KakaoStrategy } from './kakao.strategy';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    UserModule,
    PassportModule,
    HttpModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_APPKEY
          },
          secure: true
        },
        defaults: {
          from: `World Study <${process.env.EMAIL_FROM}>`
        },
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy, KakaoStrategy],
})
export class AuthModule { }

