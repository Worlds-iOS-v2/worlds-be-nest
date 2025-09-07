import { ApiProperty } from "@nestjs/swagger";

export class CommonResponseDto {
    @ApiProperty({
        example: 'API 요청 성공',
        description: 'API 요청 성공 시 메시지'
    })
    message: string;

    @ApiProperty({
        example: 200,
        description: 'API 요청 성공 시 상태 코드'
    })
    statusCode: number
}