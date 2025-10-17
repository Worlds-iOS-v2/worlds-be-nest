import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class AskQuestionDto {
    @IsString()
    @ApiProperty({
        description: '학생의 질문 내용',
        example: 'What is the capital of France?'
    })
    question: string; // 학생의 질문 내용
}