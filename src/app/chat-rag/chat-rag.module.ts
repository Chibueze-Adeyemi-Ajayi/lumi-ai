import { Module } from '@nestjs/common';
import { ChatRagService } from './chat-rag.service';
import { ChatRagController } from './chat-rag.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [ChatRagService],
  exports: [ChatRagService],
  controllers: [ChatRagController]
})
export class ChatRagModule {}
