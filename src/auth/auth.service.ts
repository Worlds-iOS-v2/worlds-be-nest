import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/CreateUserDto';
import { ConfigService } from '@nestjs/config';
import { SignInDto } from './dto/SignInDto';
import { AuthUser } from 'src/types/auth-user.interface';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    private logger = new Logger();
    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    // 회원가입
    async signUp(signupform: CreateUserDto) {
        console.log('회원가입 시작');
        const trimEmail = signupform.userEmail.toLowerCase().trim();

        // 비밀번호 해싱
        const salt = parseInt(this.config.get('SALT_ROUNDS') || '10');
        const hashedPassword = await bcrypt.hash(signupform.passwordHash, salt);

        const user = await this.prisma.users.create({
            data: {
                userEmail: trimEmail,
                userName: signupform.userName,
                birthday: signupform.userBirth,
                passwordHash: hashedPassword,
                isMentor: signupform.isMentor,
                mentorCode: signupform.mentorCode,
                reportCount: signupform.reportedCount || 0,
                refreshToken: '',
            },
        });

        console.log('회원가입 완료');
        return {
            status: 201,
            message: '회원가입 성공',
        };
    }

    // 이메일 중복 확인
    async checkEmailUnique(email: string) {
        const user = await this.prisma.users.findUnique({
            where: { userEmail: email },
        });

        if (user) {
            throw new UnauthorizedException('이미 존재하는 이메일입니다.');
        }

        return {
            message: '사용 가능한 이메일입니다.',
            status: 200
        }
    }
    
    // signin
    async signIn(signinform: SignInDto) {
        const user = await this.validateUser(signinform.userEmail, signinform.password);
        
        const accessPayload = {
            sub: user.id,
            username: user.userName,
            email: user.userEmail,
            type: 'access'
        }

        const refreshPayload = {
            sub: user.id,
            type: 'refresh',
        }

        const accessToken = this.jwtService.sign(accessPayload, {
            expiresIn: '1h',
        });

        const refreshToken = this.jwtService.sign(refreshPayload, {
            expiresIn: '30d',
        });

        await this.userService.updateRefreshToken(user.id, refreshToken);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            status: 200,
            message: '로그인 성공',
        }
    }

    // 로그인 유저 검증
    async validateUser (
        userEmail: string,
        password: string,
    ): Promise<AuthUser> {
        const user = await this.userService.findUserForValidation(userEmail);
        if (!user) {
            throw new UnauthorizedException('이메일 또는 비밀번호가 일치하지 않습니다.');
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            throw new UnauthorizedException('이메일 또는 비밀번호가 일치하지 않습니다.');
        }

        const { passwordHash: _, refreshToken: __, ...safeUser } = user;
        return safeUser as AuthUser; // 타입 보장
    }
}