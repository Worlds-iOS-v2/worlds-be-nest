import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
    @ApiProperty({ example: 1, description: '사용자 ID' })
    id: number;

    @ApiProperty({ example: "test@example.com", description: '사용자 이메일' })
    userEmail: string;

    @ApiProperty({ example: "테스트유저", description: '사용자 이름' })
    userName: string;

    @ApiProperty({ example: "1990-01-01", description: '생년월일' })
    birthday: Date;

    @ApiProperty({ example: false, description: '멘토 여부' })
    isMentor: boolean;

    @ApiProperty({ example: 0, description: '신고 횟수' })
    reportCount: number;
}

export class GetUserInfoDto {
    @ApiProperty({ example: "사용자 정보 조회 성공" })
    message: string;

    @ApiProperty({ example: 200 })
    statusCode: number;

    @ApiProperty({ 
        type: UserInfoDto,
        description: '사용자 정보'
    })
    userInfo: UserInfoDto;
}