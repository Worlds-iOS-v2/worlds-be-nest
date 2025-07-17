import { IsNotEmpty, IsString } from "class-validator";

export class RequestTranslateDto {

    
    @IsString()
    @IsNotEmpty()
    imageUrl: string;

    @IsString()
    keyConcept: string;
}