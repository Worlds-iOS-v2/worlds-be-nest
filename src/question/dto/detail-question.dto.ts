//질문 상세
import { ApiProperty } from '@nestjs/swagger';
import { Category } from 'src/common/enums/category.enum';

export class ResponseQuesitonDto {
    @ApiProperty({ description: '게시글 제목', example: '게시글 제목' })
    title: string;
    
    @ApiProperty({ description: '게시글 내용', example: '게시글 내용' })
    content: string;

    @ApiProperty({ description: '생성 시간', example: '2025-07-14T09:00:00.000Z' })
    createdAt: Date;
    
    @ApiProperty({ description: '첨부파일 URL 목록', example: ['https://example.com/file1.jpg', 'https://example.com/file2.jpg'] })
    attachments?: string[];

    @ApiProperty({ description: '유저 이름', example: '이서하' })
    userName: string;

    @ApiProperty({ description: '답변 개수', example: 2 })
    answerCount: number;

    @ApiProperty({ description: '카테고리', example: 'study', enum: Category })
    category: Category;
}