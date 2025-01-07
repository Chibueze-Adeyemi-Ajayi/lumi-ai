import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionGuard } from '../user/user.guards/user.guards';
import { ChatService } from './chat.service';
import { User } from '../user/user.schema/user.schema';
import { AuthUser } from '../user/user.decorator/user.decorator';
import { CreateChatDTO, UpdateChatDTO } from './chat.dto/chat.dto';

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

    @Get("")
    async allChats(@AuthUser() user: User) { 
        return this.chatService.allChats(user)
    }

    @Delete(":id")
    async deleteChat(@AuthUser() user: User, @Param("id") id: string) {
        return this.chatService.deleteChat(user, id)
    }

    @Patch(":id")
    async updateChat(@AuthUser() user: User, @Body() data: UpdateChatDTO, @Param("id") id: string) {
        return this.chatService.updateChat(user, data, id)
    }

}
