import { ApiProperty } from "@nestjs/swagger";
import { WithdrawalReason } from "@prisma/client";
import { IsEnum } from "class-validator";

export class DeleteUserDto {

    @IsEnum(WithdrawalReason)
    @ApiProperty({
        description: '탈퇴 사유',
        example: 'personal',
    })
    withdrawalReason: WithdrawalReason;
}