import { Module } from '@nestjs/common';
import { ChatModule } from 'src/app/chat/chat.module';

@Module({
    imports: [ChatModule]
})
export class WSChatModule {}
