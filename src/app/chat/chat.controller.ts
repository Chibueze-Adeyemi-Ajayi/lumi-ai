import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionGuard } from '../user/user.guards/user.guards';
import { ChatService } from './chat.service';
import { User } from '../user/user.schema/user.schema';
import { AuthUser } from '../user/user.decorator/user.decorator';
import { CreateChatDTO } from './chat.dto/chat.dto';

@Controller('api/v1/chat')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class ChatController {

    constructor (
        @Inject() private readonly chatService: ChatService
    ) {}

    @Post("init")
    async start (@AuthUser() user: User, @Body() data: CreateChatDTO) {
        return await this.chatService.start(user, data);
    }
    
}
