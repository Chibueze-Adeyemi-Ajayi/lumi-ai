import { Body, Controller, Inject, Patch, Post, UseGuards } from '@nestjs/common';
import { GoogleOAuthDTO, ProfileDTO } from './user.dto/user.dto';
import { UserService } from './user.service';
import { User } from './user.schema/user.schema';
import { JwtAuthGuard, PermissionGuard } from './user.guards/user.guards';
import { AuthUser } from './user.decorator/user.decorator';

@Controller(`api/v1/user`)
export class UserController {

    constructor (
        @Inject() private readonly userService: UserService
    ) {}

    @Post("google-oauth")
    async googleOauth (@Body() data: GoogleOAuthDTO) {
        return await this.userService.GoogleOauth(data)
    }

    @Patch("profile")
    @UseGuards(PermissionGuard)
    @UseGuards(JwtAuthGuard)
    async setupProfile (@AuthUser() user: User, @Body() data: ProfileDTO) {
        return this.userService.setProfile(user, data);
    }

}
