import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdatePasswordDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'original password of the user : not null',
        example: 'password123',
    })
    org_password: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'new password of the user : not null',
        example: 'password321',
    })
    new_password: string;
}