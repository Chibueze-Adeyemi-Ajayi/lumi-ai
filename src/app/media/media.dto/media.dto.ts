import { IsArray } from "class-validator";

export class DeleteFileDTO {
    @IsArray() files: string[]
}