import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/CreateUserDto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
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
}
