import { IsNumber } from "class-validator";

export class UploadFileDto {

    @IsNumber()
    userId: number;

    files: Express.Multer.File[];
}