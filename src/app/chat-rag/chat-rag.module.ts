import { Module } from '@nestjs/common';
import { ChatRagService } from './chat-rag.service';

@Module({
  providers: [ChatRagService],
  exports: [ChatRagService]
})
export class ChatRagModule {}
