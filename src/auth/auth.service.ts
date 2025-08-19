import { Injectable, UnauthorizedException, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/CreateUserDto';
import { ConfigService } from '@nestjs/config';
import { SignInDto } from './dto/SignInDto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { FindEmailDto } from './dto/FindEmailDto';
import { UpdatePasswordDto } from './dto/UpdatePasswordDto';
import { AuthUser } from 'src/types/auth-user.interface';
import { DeleteUserDto } from './dto/DeleteUserDto';
import { format } from 'date-fns';
import { MailerService } from '@nestjs-modules/mailer';
import { VerifyCodeDto } from './dto/VerifyCodeDto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetProfileImageDto } from './dto/SetProfileImageDto';
import { ProfileImage } from 'src/common/enums/profile-image.enum';
import { PROFILE_IMAGES } from 'src/common/constants/profile-Images';
import { CommonResponseDto } from 'src/common/dto/CommonResponseDto';
import { RequestResetPasswordDto } from './dto/RequestResetPasswordDto';
import { GetNewAccesstokenDto } from './dto/GetNewAccesstokenDto';

@Injectable()
export class AuthService {
    private logger = new Logger();
    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly mailerService: MailerService
    ) { }

    // 회원가입
    async signUp(signupform: CreateUserDto): Promise<CommonResponseDto> {
        this.logger.log('회원가입 시작');
        const trimEmail = signupform.userEmail.toLowerCase().trim();
        const birthday = format(new Date(signupform.userBirth), 'yyyy-MM-dd')

        // 비밀번호 해싱
        const salt = parseInt(this.config.get('SALT_ROUNDS') || '10');
        const hashedPassword = await bcrypt.hash(signupform.password, salt);

        const isVerified = await this.prisma.emailVerifications.findFirst({
            where: {
                userEmail: trimEmail,
                isVerified: true,
            }
        })
        if (!isVerified) {
            throw new BadRequestException({
                message: ['이메일 인증이 완료되지 않았습니다. 인증 후 다시 시도해주세요.'],
                error: 'BadRequest',
                statusCode: 400,
            })
        }

        const existsUser = await this.prisma.users.findUnique({
            where: {
                userEmail: trimEmail,
            }
        })

        if (existsUser) {
            // 탈퇴회원 아닌데 이메일 중복일 때
            if (!existsUser.isDeleted && existsUser.userName !== '') {
                throw new BadRequestException({
                    message: ['이미 존재하는 이메일입니다.'],
                    error: 'BadRequest',
                    statusCode: 400,
                });
                // 탈퇴회원일 때 - 재가입
            } else if (existsUser.isDeleted) {
                return await this.reactivateUser(existsUser.id, signupform);
            } else {
                await this.prisma.users.update({
                    where: {
                        userEmail: trimEmail,
                    },
                    data: {
                        userName: signupform.userName,
                        birthday: birthday,
                        passwordHash: hashedPassword,
                        isMentor: signupform.isMentor,
                        targetLanguage: signupform.targetLanguage,
                        refreshToken: '',
                        isDeleted: false,
                    },
                });

                await this.prisma.emailVerifications.deleteMany({
                    where: { userEmail: trimEmail }
                })
            }
        }

        console.log('회원가입 완료');
        return {
            message: '회원가입 성공',
            statusCode: 200,
        };
    }

    // 이메일 중복 확인
    async checkEmailAndSendVerification(email: string): Promise<CommonResponseDto> {
        const trimEmail = email.toLowerCase().trim();
      
        // 실제 유저만 중복으로 간주 (임시 유저: userName === '')
        const realUser = await this.prisma.users.findFirst({
          where: {
            userEmail: trimEmail,
            isDeleted: false,
            userName: { not: '' }, // 임시 유저는 userName === ''
          },
          select: { id: true },
        });
      
        if (realUser) {
          throw new BadRequestException({
            message: ['이미 존재하는 이메일입니다.'],
            error: 'BadRequest',
            statusCode: 400,
          });
        }
      
        await this.sendVerificationEmail(trimEmail);
        return {
          message: '사용 가능한 이메일입니다. 메일함을 확인해주세요.',
          statusCode: 200,
        };
      }

    // signin
    async signIn(signinform: SignInDto) {
        const user = await this.authenticateUser(signinform);

        if (user.isBlocked) {
            throw new BadRequestException({
                message: ['정지된 계정입니다. 관리자에게 문의해주세요.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

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
            message: '로그인 성공',
            statusCode: 200,
            username: user.userName,
            access_token: accessToken,
            refresh_token: refreshToken,
        }
    }

    // 이메일 찾기
    async findEmail(findemailform: FindEmailDto) {
        const user = await this.prisma.users.findFirst({
            where: {
                userName: findemailform.userName,
                isDeleted: false,
                isBlocked: false,
            },
            select: {
                userEmail: true,
            }
        })

        if (!user) {
            throw new UnauthorizedException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        return {
            message: '이메일 찾기 성공',
            statusCode: 200,
            userEmail: user.userEmail,
        }
    }

    // 비밀번호 검증 및 변경 - 로그인했을 때
    async updatePassword(userId: number, updatepasswordform: UpdatePasswordDto): Promise<CommonResponseDto> {
        const user = await this.userService.findUserForResetPassword(userId);
        if (!user) {
            throw new UnauthorizedException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        const isMatch = await bcrypt.compare(updatepasswordform.org_password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException({
                message: ['비밀번호가 일치하지 않습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        const isExsists = await bcrypt.compare(updatepasswordform.new_password, user.passwordHash);
        if (isExsists) {
            throw new BadRequestException({
                message: ['기존에 사용하던 비밀번호와 동일합니다. 다른 비밀번호를 입력해주세요.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        const salt = parseInt(this.config.get('SALT_ROUNDS') || '10');
        const hashedPassword = await bcrypt.hash(updatepasswordform.new_password, salt);

        await this.prisma.users.update({
            where: {
                id: userId,
                isDeleted: false,
                isBlocked: false,
            },
            data: {
                passwordHash: hashedPassword,
            }
        })

        return {
            message: '비밀번호 변경 성공',
            statusCode: 200,
        }
    }

    // 리프레시 토큰 검증 + 액세스 토큰 재발급
    async validateRefreshToken(getnewaccesstokenform: GetNewAccesstokenDto) {
        const token = getnewaccesstokenform.refreshToken
        try {
            // JWT 검증
            const decoded = this.jwtService.verify(token, {
                secret: this.config.get('JWT_SECRET'),
            })
            const user = await this.userService.findUserForTokenRefresh(decoded.sub);

            // 토큰 타입 검증
            if (decoded.type !== 'refresh') {
                throw new UnauthorizedException({
                    message: ['Refresh token이 아닙니다.'],
                    error: 'Unauthorized',
                    statusCode: 401,
                });
            }

            // 용자 존재 및 토큰 검증
            if (!user || !user.refreshToken || user.refreshToken === '') {
                throw new UnauthorizedException({
                    message: ['사용자 또는 토큰을 찾을 수 없습니다.'],
                    error: 'Unauthorized',
                    statusCode: 401,
                });
            }

            if (token !== user.refreshToken) {
                throw new UnauthorizedException({
                    message: ['유효하지 않는 토큰입니다.'],
                    error: 'Unauthorized',
                    statusCode: 401,
                });
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

            return {
                message: '액세스 토큰 재발급 성공',
                statusCode: 200,
                access_token: newAccessToken,
            };
        } catch (error) {
            this.logger.error('Refresh token error:', {
                errorName: error?.name,
                errorMessage: error?.message,
                errorStack: error?.stack,
            });

            throw new UnauthorizedException({
                message: ['토큰이 유효하지 않습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }
    }

    // 로그아웃
    async logout(userId: number): Promise<CommonResponseDto> {
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
            statusCode: 200,
        }
    }

    // 사용자 정보 조회
    async getUserInfo(userId: number) {
        const user = await this.userService.findUserById(userId);

        if (!user) {
            throw new UnauthorizedException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        return {
            message: '사용자 정보 조회 성공',
            statusCode: 200,
            userInfo: user,
        }
    }

    // 로그인 유저 검증
    async authenticateUser(
        signinform: SignInDto,
    ): Promise<AuthUser> {
        const user = await this.userService.findUserForValidation(signinform.userEmail);
        if (!user) {
            throw new UnauthorizedException({
                message: ['이메일 또는 비밀번호가 일치하지 않습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        const isMatch = await bcrypt.compare(signinform.password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException({
                message: ['이메일 또는 비밀번호가 일치하지 않습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        if (user.isBlocked) {
            throw new BadRequestException({
                message: ['정지된 계정입니다. 관리자에게 문의해주세요.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        const { passwordHash: _, refreshToken: __, ...safeUser } = user;
        return safeUser as AuthUser;
    }

    // 회원 탈퇴 (soft-delete)
    async deactivateUser(userId: number, deleteuserform: DeleteUserDto) {
        const user = await this.prisma.users.findUnique({
            where: {
                id: userId,
                isDeleted: false,
                isBlocked: false,
            }
        })

        if (!user) {
            throw new UnauthorizedException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            })
        }

        await this.prisma.users.update({
            where: {
                id: userId,
                isDeleted: false,
                isBlocked: false,
            },
            data: {
                isDeleted: true,
                WithdrawalReason: deleteuserform.withdrawalReason,
            }
        })

        return {
            message: '회원탈퇴 성공',
            statusCode: 200,
            withdrawalReason: deleteuserform.withdrawalReason,
        }
    }

    // 탈퇴 회원 재가입
    async reactivateUser(userId: number, signupform: CreateUserDto): Promise<CommonResponseDto> {
        const salt = parseInt(this.config.get('SALT_ROUNDS') || '10');
        const hashedPassword = await bcrypt.hash(signupform.password, salt);
        const trimEmail = signupform.userEmail.toLowerCase().trim();
        const birthday = format(signupform.userBirth, 'yyyy-MM-dd')

        await this.prisma.users.update({
            where: {
                id: userId,
            },
            data: {
                userEmail: trimEmail,
                userName: signupform.userName,
                birthday: birthday,
                passwordHash: hashedPassword,
                isMentor: signupform.isMentor,
                targetLanguage: signupform.targetLanguage,
                isDeleted: false,
                refreshToken: '',
            }
        })

        return {
            message: '탈퇴 회원 재가입 성공',
            statusCode: 200,
        }
    }

    // 출석 체크
    async checkAttendance(userId: number): Promise<CommonResponseDto> {
        const user = await this.userService.findUserById(userId);

        if (!user) {
            throw new UnauthorizedException({
                message: ['사용자를 찾을 수 없습니다.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        // 오늘 출석 여부 확인
        const isAttendance = await this.prisma.attendance.findFirst({
            where: {
                userId: user.id,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                }
            }
        });

        if (isAttendance) {
            return {
                message: '이미 출석했습니다.',
                statusCode: 208,
            }
        }

        const attendance = await this.prisma.attendance.create({
            data: {
                userId: user.id,
                createdAt: new Date(),
            }
        })

        const createdAt = new Date(attendance.createdAt);
        const attendaceDate = format(createdAt, 'yyyy-MM-dd');
        console.log(`출석 체크 완료: ${attendaceDate}`);

        return {
            message: '출석 체크 성공',
            statusCode: 200
        }
    }

    // 전체 출석 일자 조회
    async getAttendanceDates(userId: number) {
        const user = await this.userService.findUserById(userId);

        if (!user) {
            throw new UnauthorizedException({
                message: ['사용자를 찾을 수 없습니다.'],
                statusCode: 401,
                error: 'Unauthorized',
            });
        }

        const attendanceDates = await this.prisma.attendance.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                createdAt: true
            },
            take: 14
        })

        const dates = attendanceDates.map(date =>
            format(new Date(date.createdAt), 'yyyy-MM-dd')
        )

        return {
            message: '출석 일자 조회 성공',
            statusCode: 200,
            dates,
        }
    }

    // 비밀번호 찾기 - 로그인 안했을 때
    async requestPasswordReset(requestpasswordresetform: RequestResetPasswordDto): Promise<CommonResponseDto> {
        const trimEmail = requestpasswordresetform.email.toLowerCase().trim();

        const user = await this.userService.findUserForPasswordReset(trimEmail);
        if (!user) {
            throw new UnauthorizedException({
                message: ['이메일을 찾을 수 없습니다. 이메일을 확인해주세요.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        await this.sendVerificationEmail(trimEmail);
        await this.prisma.emailVerifications.upsert({
            where: { userEmail: trimEmail },
            update: { isVerified: false },
            create: {
                userId: user.id,
                userEmail: trimEmail,
                verificationCode: '',
                expirationTime: new Date(),
                isVerified: false,
            }
        })

        return {
            message: '인증 코드를 발송했습니다. 메일함을 확인해주세요.',
            statusCode: 200,
        }
    }

    // 비밀번호 변경
    async changePassword(changepasswordform: ResetPasswordDto): Promise<CommonResponseDto> {
        const trimEmail = changepasswordform.email.toLowerCase().trim();

        const user = await this.userService.findUserForPasswordReset(trimEmail);

        const isUsed = await this.userService.comparePassword(changepasswordform.newPassword, user.passwordHash);
        if (isUsed) {
            throw new BadRequestException({
                message: ['이미 사용중인 비밀번호입니다. 다른 비밀번호를 입력해주세요.'],
                error: 'BadRequest',
                statusCode: 400,
            })
        }

        const isVerified = await this.prisma.emailVerifications.findFirst({
            where: {
                userEmail: trimEmail,
                isVerified: true,
            }
        })
        if (!isVerified) {
            throw new BadRequestException({
                message: ['이메일 인증이 완료되지 않았습니다. 인증 후 다시 시도해주세요.'],
                error: 'BadRequest',
                statusCode: 400,
            })
        }

        const salt = parseInt(this.config.get('SALT_ROUNDS') || '10');
        const hashedPassword = await bcrypt.hash(changepasswordform.newPassword, salt);

        await this.prisma.users.update({
            where: {
                id: user.id,
            },
            data: {
                passwordHash: hashedPassword,
            }
        })

        return {
            message: '비밀번호 변경 성공',
            statusCode: 200,
        }
    }

    // 이메일 인증 코드 전송
    async sendVerificationEmail(email: string): Promise<CommonResponseDto>{
        const temporaryCode = this.generateTemporaryCode();
        const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        const fromemail = this.config.get('EMAIL_FROM');
        const trimEmail = email.toLowerCase().trim();

        try {
            await this.mailerService.sendMail({
                to: email,
                from: fromemail,
                subject: '이메일 인증 - World Study',
                html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>World Study - 이메일 인증</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  color: #333; 
                  background-color: #f5f5f5;
                  margin: 0;
                  padding: 20px 0;
                }
                
                .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background-color: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  overflow: hidden;
                }
                
                .header { 
                  background-color: #667eea; 
                  color: white; 
                  padding: 40px 30px; 
                  text-align: center; 
                }
                
                .header h1 { 
                  font-size: 28px; 
                  font-weight: bold; 
                  margin-bottom: 10px;
                  margin-top: 0;
                }
                
                .header p {
                  font-size: 16px;
                  margin: 0;
                  opacity: 0.9;
                }
                
                .content { 
                  padding: 40px 30px; 
                  background-color: #ffffff;
                }
                
                .welcome-text {
                  font-size: 18px;
                  color: #333;
                  margin-bottom: 30px;
                  line-height: 1.6;
                  text-align: center;
                }
                
                .welcome-text strong {
                  color: #667eea;
                  font-weight: bold;
                }
                
                .code-section {
                  background-color: #f8f9fa;
                  border: 2px solid #667eea;
                  border-radius: 8px;
                  padding: 30px;
                  margin: 30px 0;
                  text-align: center;
                }
                
                .code-label {
                  font-size: 14px;
                  color: #666;
                  margin-bottom: 20px;
                  font-weight: bold;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                
                .code { 
                  font-size: 48px; 
                  font-weight: bold; 
                  color: #667eea; 
                  letter-spacing: 8px; 
                  font-family: 'Courier New', monospace;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  border: 1px solid #ddd;
                  display: inline-block;
                  min-width: 280px;
                }
                
                .expiry-notice {
                  text-align: center;
                  color: #666;
                  font-size: 14px;
                  margin: 25px 0;
                  padding: 15px;
                  background-color: #f8f9fa;
                  border-radius: 6px;
                  border-left: 4px solid #667eea;
                }
                
                .button-container {
                  text-align: center;
                  margin: 30px 0;
                }
                
                .button { 
                  display: inline-block; 
                  padding: 15px 30px; 
                  background-color: #667eea; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 6px; 
                  font-weight: bold;
                  font-size: 16px;
                }
                
                .info-section {
                  background-color: #f0f8ff;
                  border-radius: 8px;
                  padding: 20px;
                  margin: 25px 0;
                  border-left: 4px solid #48bb78;
                }
                
                .info-section h3 {
                  color: #333;
                  font-size: 16px;
                  margin-bottom: 10px;
                  font-weight: bold;
                  margin-top: 0;
                }
                
                .info-section p {
                  color: #555;
                  font-size: 14px;
                  line-height: 1.5;
                  margin: 0;
                }
                
                .section-divider {
                  height: 2px;
                  background-color: #e0e0e0;
                  margin: 30px 0;
                  text-align: center;
                }
                
                .section-divider::before {
                  content: '• • •';
                  background-color: #ffffff;
                  color: #999;
                  padding: 0 15px;
                  font-size: 12px;
                  position: relative;
                  top: -8px;
                }
                
                .footer { 
                  text-align: center; 
                  padding: 30px;
                  background-color: #f8f9fa;
                  border-top: 1px solid #e0e0e0;
                  color: #666; 
                  font-size: 14px; 
                }
                
                .footer p {
                  margin-bottom: 8px;
                  margin-top: 0;
                }
                
                .contact-email {
                  color: #667eea;
                  text-decoration: none;
                  font-weight: bold;
                }
                
                .copyright {
                  margin-top: 15px;
                  font-size: 12px;
                  color: #999;
                }
                
                @media (max-width: 600px) {
                  .container { 
                    margin: 10px; 
                    border-radius: 6px; 
                  }
                  .header { 
                    padding: 30px 20px; 
                  }
                  .content { 
                    padding: 30px 20px; 
                  }
                  .code { 
                    font-size: 36px; 
                    letter-spacing: 6px; 
                    padding: 15px 20px;
                    min-width: 240px;
                  }
                  .button {
                    padding: 12px 25px;
                    font-size: 15px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎓 World Study</h1>
                  <p>이메일 인증을 완료해주세요</p>
                </div>
                <div class="content">
                  <div class="welcome-text">
                    안녕하세요 <strong>${email}</strong>님!<br>
                    World Study에 오신 것을 환영합니다! 🎉
                  </div>
                  
                  <div class="info-section">
                    <h3>📧 이메일 인증이 필요합니다</h3>
                    <p>계정 보안을 위해 이메일 인증을 완료해주세요. 아래의 인증 코드를 입력하거나 버튼을 클릭하여 인증을 진행할 수 있습니다.</p>
                  </div>
    
                  <div class="section-divider"></div>
    
                  <div class="code-section">
                    <div class="code-label"><strong>인증 코드</strong></div>
                    <div class="code">${temporaryCode}</div>
                  </div>
    
                  <div class="section-divider"></div>
    
                  <div class="expiry-notice">
                    ⏰ 이 코드는 10분간 유효합니다
                  </div>
    
                  <div class="button-container">
                    <a href="localhost:3002/verify?code=${temporaryCode}&userId=${email}" class="button">
                      ✨ 인증 완료하기
                    </a>
                  </div>
    
                  <div class="info-section">
                    <h3>🔒 보안 안내</h3>
                    <p>• 인증 코드는 절대 타인에게 공유하지 마세요<br>
                    • 의심스러운 이메일이나 링크를 클릭하지 마세요<br>
                    • 계정 보안을 위해 정기적으로 비밀번호를 변경하세요</p>
                  </div>
                </div>
                <div class="footer">
                  <p>이 이메일은 자동으로 발송되었습니다.</p>
                  <p>문의사항이 있으시면 <a href="mailto:worldstudypj@gmail.com" class="contact-email">worldstudypj@gmail.com</a>으로 연락주세요.</p>
                  <p class="copyright">© 2025 World Study. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
            });

            // 임시 유저 생성
            const temporaryUser = await this.prisma.users.upsert({
                where: { userEmail: trimEmail },
                update: {},
                create: {
                    userEmail: trimEmail,
                    userName: '',
                    birthday: '',
                    passwordHash: '',
                    isDeleted: false,
                    isBlocked: false,
                    targetLanguage: '',
                    refreshToken: '',
                }
            })

            const emailVerification = await this.prisma.emailVerifications.upsert({
                where: { userEmail: trimEmail },
                update: {
                    verificationCode: temporaryCode,
                    expirationTime: expirationTime,
                },
                create: {
                    userId: temporaryUser.id,
                    userEmail: trimEmail,
                    verificationCode: temporaryCode,
                    expirationTime: expirationTime,
                }
            })

            console.log(`${trimEmail} 인증 코드 전송 성공, 이메일 인증 코드: ${emailVerification.verificationCode}`);

            return {
                message: '인증번호를 전송했습니다. 메일함을 확인해주세요.',
                statusCode: 200,
            };
        } catch (error) {
            this.logger.error('인증번호 전송 오류: ', error)
            console.log('인증번호 전송 오류: ', error)

            throw new InternalServerErrorException({
                message: ['이메일 인증 번호 전송에 실패했습니다. 다시 시도해주세요.'],
                error: 'InternalServerError',
                statusCode: 500,
            });
        }
    }

    // 랜덤 인증 번호 생성
    private generateTemporaryCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 이메일 인증 번호 검증
    async verifyCode(verifycodeform: VerifyCodeDto): Promise<CommonResponseDto> {
        const trimEmail = verifycodeform.email.toLowerCase().trim();
        const trimCode = verifycodeform.verificationCode.toUpperCase().trim();

        const verification = await this.prisma.emailVerifications.findFirst({
            where: {
                userEmail: trimEmail,
                verificationCode: trimCode,
            },
        });

        // 인증번호 유효하지 않음
        if (!verification) {
            throw new UnauthorizedException({
                message: ['인증번호가 유효하지 않습니다. 다시 요청해주세요.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        // 이미 인증됨
        if (verification.isVerified) {
            throw new BadRequestException({
                message: ['이미 인증이 완료된 이메일입니다.'],
                error: 'BadRequest',
                statusCode: 400,
            });
        }

        // 유효기간 만료
        if (verification.expirationTime < new Date()) {
            throw new UnauthorizedException({
                message: ['인증번호의 유효기간이 만료되었습니다. 새로운 인증번호를 요청해주세요.'],
                error: 'Unauthorized',
                statusCode: 401,
            });
        }

        await this.prisma.emailVerifications.update({
            where: {
                userEmail: trimEmail,
            },
            data: {
                isVerified: true,
            }
        })

        return {
            message: '인증이 완료되었습니다.',
            statusCode: 200,
        }
    }

    // 사용자 프로필 이미지 저장/변경
    async setProfileImage(userId: number, setprofileform: SetProfileImageDto) {
        try {
            const NUMBER_TO_ENUM: Record<number, ProfileImage> = {
                1: ProfileImage.HIMCHAN,
                2: ProfileImage.DORAN,
                3: ProfileImage.MALGEUM,
                4: ProfileImage.SANEGGAK,
            };
            const preset = NUMBER_TO_ENUM[setprofileform.image]

            const user = await this.prisma.users.update({
                where: {
                    id: userId
                },
                data: {
                    profileImage: preset
                }
            })

            return {
                message: '프로필 이미지 설정 성공',
                statusCode: 200,
                profileImage: user.profileImage,
                profileImageUrl: PROFILE_IMAGES[preset]
            }
        } catch (error) {
            this.logger.error('프로필 이미지 설정 실패: ', error)

            throw new InternalServerErrorException({
                message: ['이미지 설정 오류 발생'],
                error: 'InternalServerError',
                statusCode: 500
            })
        }
    }
}