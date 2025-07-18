import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RequestOCRDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'image url of the image to be translated',
        example: 'https://example.com/image.jpg',
    })
    imageUrl: string;
}