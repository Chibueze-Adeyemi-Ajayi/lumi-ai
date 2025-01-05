import { IsString, IsInt } from 'class-validator';

export class GoogleOAuthDTO {
   @IsString() access_token: string
}

export class ProfileDTO {
   @IsString() department: string;
   @IsString() title: string;
   @IsString() description: string;
}