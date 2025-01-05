import { IsArray } from "class-validator";

export class CreateChatDTO {
    @IsArray() ids: string []
}