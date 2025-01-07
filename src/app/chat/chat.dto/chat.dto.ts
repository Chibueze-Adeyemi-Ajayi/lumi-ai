import { IsArray, IsString } from "class-validator";

export class CreateChatDTO {
    @IsArray() ids: string [];
    @IsString() title: string;
}


export class UpdateChatDTO {
    @IsArray() documents: string [];
    @IsString() title: string;
}