import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import * as bcrypt from 'bcrypt';
import { SignInDto } from 'src/auth/dto/SignInDto';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    // 리프레시 토큰 업데이트 (DB)
    async updateRefreshToken(userId: number, token: string | null) {
        console.log('updateRefreshToken - userId:', userId, 'tokenId:', token);
        
        const result = await this.prisma.users.update({
            where: {
                id: userId,
                isDeleted: false,
                isBlocked: false,
            },
            data: {
                refreshToken: token || '',
            },
        });
        
        console.log('updateRefreshToken 결과:', result.refreshToken);
        return result;
    }

    // 리프레시토큰 재발급 위해 유저 찾음
    async findUserForTokenRefresh(userId: number) {
        return await this.prisma.users.findUnique({
            where: {
                id: userId,
                isDeleted: false,
                isBlocked: false,
            },
            select: {
                id: true,
                userEmail: true,
                refreshToken: true,
                userName: true,
            },
        });
    }

    // 유저 정보 가져오기
    async findUserById(userId: number) {
        return await this.prisma.users.findUnique({
            where: {
                id: userId,
                isDeleted: false,
                isBlocked: false,
            },
            select: {
                id: true,
                userEmail: true,
                userName: true,
                birthday: true,
                isMentor: true,
                reportCount: true,
                menteeTranslations: true,
            }
        })
    }

    // 로그인 검증을 위해 유저 찾음 (passwordHash 포함)
    async findUserForValidation(email: string) {
        return await this.prisma.users.findUnique({
            where: {
                userEmail: email,
                isDeleted: false,
            },
            select: {
                id: true,
                userEmail: true,
                passwordHash: true,
                refreshToken: true,
                userName: true,
                isBlocked: true,
            },
        });
    }

    // 비밀번호 변경을 위한 유저 찾기
    async findUserForResetPassword(userId: number) {
        return await this.prisma.users.findUnique({
            where: {
                id: userId,
                isDeleted: false,
                isBlocked: false,
            },
            select: {
                id: true,
                passwordHash: true,
            }
        });
    }

    // 로그인해서 인증된 유저 넘기기
    async signInWithEmail(signinform: SignInDto) {
        const plainPWD = signinform.password;

        const user = await this.prisma.users.findUnique({
            where: {
                userEmail: signinform.userEmail,
                isDeleted: false,
                isBlocked: false,
            },
        });

        if (!user) {
            throw new BadRequestException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'NotFound',
                statusCode: 404,
            });
        }

        // 이메일 일치하는지 확인
        const isEmailMatch = user.userEmail === signinform.userEmail;

        // 비밀번호 일치하는지 확인
        const isPasswordMatch = await this.comparePassword(plainPWD, user.passwordHash || '');

        if (!isPasswordMatch || !isEmailMatch) {
            throw new UnauthorizedException({
                message: ['일치하는 정보가 없습니다. 이메일 혹은 비밀번호를 확인해주세요.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        return user;
    }

    // 비밀번호 찾기용 이메일 검증
    async findUserForPasswordReset(email: string) {
        const trimEmail = email.toLowerCase().trim();

        const user = await this.prisma.users.findFirst({
            where: {
                userEmail: trimEmail,
                isDeleted: false,
            },
            select: {
                id: true,
                passwordHash: true,
            }
        })

        if (!user) {
            throw new NotFoundException({
                message: ['사용자를 찾을 수 없습니다. 올바른 이메일을 입력해주세요.'],
                error: 'NotFound',
                statusCode: 404,
            })
        }

        return user;
    }

    // 비밀번호 일치하는지 확인
    async comparePassword(plainPWD: string, hashedPWD: string): Promise<boolean> {
        return bcrypt.compare(plainPWD, hashedPWD);
    }

    // 유저 차단
    async blockUser(userId: number) {
        const user = await this.prisma.users.findUnique({
            where: {
                id: userId,
            }
        })

        if (user) {
            if (user.reportCount >= 10) {
                await this.prisma.users.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        refreshToken: '',
                        isBlocked: true,
                    }
                })
            }
        }
    }
}