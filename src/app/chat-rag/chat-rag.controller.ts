import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionGuard } from '../user/user.guards/user.guards';
import { ChatRagService } from './chat-rag.service';

@Controller('api/v1/chat-rag')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class ChatRagController {
    constructor(
        @Inject() private readonly chatRagService: ChatRagService
    ){}
    @Get("templates")
    async allTemplate() {
        return await this.chatRagService.allTemplates()
    }
}
