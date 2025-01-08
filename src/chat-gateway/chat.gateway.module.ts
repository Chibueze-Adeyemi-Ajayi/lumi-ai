import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatModule } from 'src/app/chat/chat.module';
import { ChatGateway, ChatGatewaySchema } from './chat.gateway.schema/chat.gateway.schema';
import { UserModule } from 'src/app/user/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: ChatGateway.name, schema: ChatGatewaySchema}
        ]),
        ChatModule,
        UserModule
    ] 
})
export class ChatGatewayModule {}
