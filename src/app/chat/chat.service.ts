import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatDocument } from './chat.schema/chat.schema';
import { Model } from 'mongoose';
import { User } from '../user/user.schema/user.schema';
import { CreateChatDTO } from './chat.dto/chat.dto';
import { ChatCohere } from '@langchain/cohere';
import { ChatRagService } from '../chat-rag/chat-rag.service';
import { MediaService } from '../media/media.service';

@Injectable()
export class ChatService implements OnModuleInit {

    private logger = new Logger(ChatService.name);
    private llm;

    constructor(
        @InjectModel(Chat.name) private readonly chat: Model<ChatDocument>,
        @Inject() private readonly chatRagService: ChatRagService,
        @Inject() private readonly mediaService: MediaService,
    ) { }

    onModuleInit() {
        this.logger.debug("Initializing LLM");
        const chatcohere = new ChatCohere({
            model: "command-r",
            apiKey: process.env.COHERE_API_KEY,
            temperature: .5,
            maxRetries: 3
        });
        this.llm = chatcohere;
        this.logger.debug("Done initializing LLM")
    }

    async start(user: User, data: CreateChatDTO) {
        let urls = [];
        for (const id of data.ids) {
            let media = await this.mediaService.load(id);
            urls.push(media.url);
        }   
        let llm = await this.chatRagService.getChain(this.llm, urls);
        return {
            message: "Chat initiated successfully",
            data: llm
        }
    }

}
