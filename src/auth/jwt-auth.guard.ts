import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          message: ['사용자를 찾을 수 없습니다.'],
          error: 'Unauthorized',
          statusCode: 401,
        })
      );
    }
    return user;
  }
}
