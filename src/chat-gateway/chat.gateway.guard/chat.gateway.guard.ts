import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from 'src/app/chat/chat.service';

@Injectable()
export class ChatPermissionGuard implements CanActivate {
  constructor(private chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;
    const token = authorizationHeader.split(' ')[1];
    const user = await this.chatService.getChat(token)

    request.headers["user"] = user;

    // if (!user.is_active) throw new HttpException({reason: "This account is no longer active"}, HttpStatus.UNAUTHORIZED)
    
    return true;
  }
}