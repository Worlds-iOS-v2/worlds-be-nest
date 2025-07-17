import { IsNotEmpty, IsString } from "class-validator";

export class RequestOCRDto {
    @IsString()
    @IsNotEmpty()
    imageUrl: string;
}