import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException({
        message: ['JWT_SECRET is not defined'],
        error: 'InternalServerError',
        statusCode: 500,
      });
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // access token만 허용 (refresh token은 거부)
    if (payload.type !== 'access') {
      throw new UnauthorizedException({
        message: ['Access token이 필요합니다.'],
        error: 'Unauthorized',
        statusCode: 401,
      });
    }

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  }
}
