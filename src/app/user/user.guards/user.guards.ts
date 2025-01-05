import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../user.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

    private logger = new Logger(JwtAuthGuard.name)

    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            this.logger.error(err)
            throw err || new UnauthorizedException();
        }
        let { userId } = user;
        this.logger.debug(userId)
        return user;
    }

}  

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;
    const token = authorizationHeader.split(' ')[1];
    const user = await this.userService.getUser(token)

    request.headers["user"] = user;

    if (!user.is_active) throw new HttpException({reason: "This account is no longer active"}, HttpStatus.UNAUTHORIZED)
    
    return true;
  }
}