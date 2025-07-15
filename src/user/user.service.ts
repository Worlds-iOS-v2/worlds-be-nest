import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
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
    async findUserForUpdate(userId: number) {
        return await this.prisma.users.findUnique({
            where: {
                id: userId,
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
            },
            select: {
                id: true,
                userEmail: true,
                passwordHash: true,
                refreshToken: true,
                userName: true,
            },
        });
    }

    // 로그인해서 인증된 유저 넘기기
    async signInWithEmail(signinform: SignInDto) {
        const plainPWD = signinform.password;

        const user = await this.prisma.users.findUnique({
            where: {
                userEmail: signinform.userEmail,
            },
        });

        if (!user) {
            throw new HttpException(
                '사용자를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 비밀번호 일치하는지 확인
        const isMatch = await this.comparePassword(plainPWD, user.passwordHash || '');

        if (!isMatch || !user) {
            throw new UnauthorizedException('일치하는 정보가 없습니다. 이메일 혹은 비밀번호를 확인해주세요.');
        }

        return user;
    }

    // 비밀번호 일치하는지 확인
    async comparePassword(plainPWD: string, hashedPWD: string): Promise<boolean> {
        return bcrypt.compare(plainPWD, hashedPWD);
    }
}