import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { GoogleOAuthDTO, ProfileDTO } from './user.dto/user.dto';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema/user.schema';
import { Profile, ProfileDocument } from './user.schema/profile.schema';

@Injectable()
export class UserService {

    constructor(
        @Inject() private readonly jwtService: JwtService,
        @InjectModel(User.name) private readonly user: Model<UserDocument>,
        @InjectModel(Profile.name) private readonly profile: Model<ProfileDocument>,
    ) { }

    private logger = new Logger(UserService.name)

    private async verify_google_access_token(access_token: string): Promise<{ email: string, name: string, sub: string }> | null {
        try {
            let { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            })
            return {
                email: data.email, name: data.name, sub: data.sub
            }
        } catch (e) {
            this.logger.error("Google Authentication failed")
            return null;
        }
    }

    private async generateJWT(auth: { id: string, email: string }): Promise<{ access_token: string }> {
        const payload = { sub: auth.id, username: auth.email };
        let jwt_secret = process.env.JWT_SECRET;
        return {
            access_token: await this.jwtService.signAsync(payload, {
                secret: jwt_secret,
            }),
        };
    }

    async GoogleOauth(data: GoogleOAuthDTO) {
        let res = await this.verify_google_access_token(data.access_token);
        const { email, name, sub } = res;
        if (!res) throw new HttpException({ message: "Invalid Google OAuth access token" }, HttpStatus.UNAUTHORIZED);
        let _user: User = await this.user.findOne({ email: res["email"] });
        if (_user) if (!_user.is_active) throw new HttpException({ message: "Account not active" }, HttpStatus.FORBIDDEN);
        if (!_user) _user = await (new this.user({ email, name, sub })).save();
        let { access_token } = await this.generateJWT({ id: (<any>_user).id, email: _user.email });
        await this.user.findByIdAndUpdate((<any>_user).id, { jwt: access_token })
        return {
            message: "Action successful",
            data: { jwt: access_token, email, name, sub }
        };
    }

    async setProfile(user: User, data: ProfileDTO) {
        let payload = {
            userId: (<any> user).id,
            department: data.department,
            project_title: data.title,
            project_description: data.description,
        }
        let profile = await this.profile.findOne({ userId: (<any>user).id });
        if (!profile) profile = await (new this.profile({ userId: (<any>user).id, ... payload })).save()
        await this.profile.findByIdAndUpdate(profile.id, { ... payload })
        return {
            message: "Profile action successful",
            data: profile
        }
    }

    async getUser(jwt: string) {
        return this.user.findOne({ jwt })
    }

}
