import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/CreateUserDto';
import { ConfigService } from '@nestjs/config';
import { SignInDto } from './dto/SignInDto';
import { AuthUser } from 'src/types/auth-user.interface';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserInfoDto } from './dto/UpdateUserInfoDto';

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

    // 리프레시 토큰 검증 + 재발급
    async validateRefreshToken(token: string) {
        try {
            // 1. JWT 검증
            const decoded = this.jwtService.verify(token, {
                secret: this.config.get('JWT_SECRET'),
            })
            const user = await this.userService.findUserForTokenRefresh(decoded.sub);

            // 2. 토큰 타입 검증
            if (decoded.type !== 'refresh') {
                throw new UnauthorizedException('Refresh token이 아닙니다.');
            }

            // 3. 사용자 존재 및 토큰 검증
            if (!user || !user.refreshToken || user.refreshToken === '') {
                throw new UnauthorizedException('사용자 또는 토큰을 찾을 수 없습니다.');
            }

            if (token !== user.refreshToken) {
                throw new UnauthorizedException('유효하지 않는 토큰입니다.');
            }

            const accessPayload = {
                sub: user.id,
                username: user.userName,
                type: 'access',
            }

            const refreshPayload = {
                sub: user.id,
                type: 'refresh',
            }

            const newAccessToken = this.jwtService.sign(accessPayload, {
                expiresIn: '1h',
            });

            const newRefreshToken = this.jwtService.sign(refreshPayload, {
                expiresIn: '30d',
            });

            await this.userService.updateRefreshToken(user.id, newRefreshToken);

            return {
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
            };
        } catch (error) {
            this.logger.error('Refresh token error:', {
                errorName: error?.name,
                errorMessage: error?.message,
                errorStack: error?.stack,
            });

            throw new UnauthorizedException('토큰이 유효하지 않습니다.');
        }
    }

    // 로그아웃
    async logout(userId: number) {
        console.log('로그아웃 시작 - userId:', userId);
        
        // 로그아웃 전 refresh token 확인
        const userBefore = await this.userService.findUserForTokenRefresh(userId);
        console.log('로그아웃 전 refresh token:', userBefore?.refreshToken);
        
        // refresh token 빈 문자열로 설정
        await this.userService.updateRefreshToken(userId, '');
        
        // 로그아웃 후 refresh token 확인
        const userAfter = await this.userService.findUserForTokenRefresh(userId);
        console.log('로그아웃 후 refresh token:', userAfter?.refreshToken);
        
        return {
            message: '로그아웃 성공',
            status: 200,
        }
    }

    // 유저 정보 수정
    async updateUserInfo(userId: number, updateinfodto: UpdateUserInfoDto) {
        console.log('updateUserInfo 시작 - userId:', userId);

        const user = await this.userService.findUserForUpdate(userId);
        if (!user) {
            throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
        }

        const updatedUser = await this.prisma.users.update({
            where: {
                id: userId,
            },
            data: {
                userName: updateinfodto.userName,
            },
            select: {
                id: true,
                userName: true,
            }
        })

        return {
            message: '유저 정보 수정 성공',
            status: 200,
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