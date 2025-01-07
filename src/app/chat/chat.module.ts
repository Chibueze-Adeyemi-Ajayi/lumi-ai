import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './chat.schema/chat.schema';
import { ChatRagModule } from '../chat-rag/chat-rag.module';
import { MediaModule } from '../media/media.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Chat.name, schema: ChatSchema}
    ]),
    ChatRagModule,
    MediaModule,
    UserModule
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService]
})
export class ChatModule {}
