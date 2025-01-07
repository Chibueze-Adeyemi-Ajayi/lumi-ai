import { HttpException, HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatDocument } from './chat.schema/chat.schema';
import { Model } from 'mongoose';
import { User } from '../user/user.schema/user.schema';
import { CreateChatDTO, UpdateChatDTO } from './chat.dto/chat.dto';
import { ChatCohere } from '@langchain/cohere';
import { ChatRagService } from '../chat-rag/chat-rag.service';
import { MediaService } from '../media/media.service';
import { CHATS } from 'src/main';
import { RunnableSequence } from '@langchain/core/runnables';
import { IChat } from 'src/chat/chat.gateway/chat.gateway.interface';

@Injectable()
export class ChatService implements OnModuleInit {

    private logger = new Logger(ChatService.name);
    private llm;

    constructor(
        @InjectModel(Chat.name) private readonly chat: Model<ChatDocument>,
        @Inject() private readonly chatRagService: ChatRagService,
        @Inject() private readonly mediaService: MediaService,
    ) { }

    async onModuleInit() {
        this.initLLM();
        await this.loadChats();
    }

    private async loadChats() {
        this.logger.debug("Loading chats")
        let chats = await this.chat.find();
        for (const chat of chats) {

            let urls = chat.documents;
            let chain = await this.chatRagService.getChain(this.llm, urls);

            CHATS.push({
                chat: chat.id,
                rag: chain
            });

        }
        this.logger.debug("Done loading chats")
    }

    private initLLM() {
        this.logger.debug("Initializing LLM");
        const chatcohere = new ChatCohere({
            model: "command-r",
            apiKey: process.env.COHERE_API_KEY,
            temperature: .5,
            maxRetries: 3
        });
        this.llm = chatcohere;
        this.logger.debug("Done initializing LLM");
    }

    async allChats(user: User) {
        return this.chat.find({ userId: (<any>user).id })
    }

    async deleteChat(user: User, id: string) {
        if (!await this.chat.findByIdAndDelete(id)) throw new HttpException({ reason: "Unable to delete this chat" }, HttpStatus.FORBIDDEN);
        return {
            message: "Chat successfully deleted",
            data: []
        }
    }

    async start(user: User, data: CreateChatDTO) {
        let urls = [];

        for (const id of data.ids) {
            let media = await this.mediaService.load(id);
            urls.push(media.url);
        }

        let chain = await this.chatRagService.getChain(this.llm, urls);

        this.logger.debug("Creating Chat")
        let chat = await (new this.chat({ chats: [], title: data.title, userId: (<any>user).id, documents: urls })).save()

        CHATS.push({
            chat: chat.id,
            rag: chain
        });

        return {
            message: "Chat initiated successfully",
            data: await this.allChats(user)
        }
    }

    private async deleteRagByChat(arr: Array<{chat: string, rag: RunnableSequence<any, string>}>, chatToDelete: string) {
        const newArray = arr.filter(obj => obj.chat !== chatToDelete);
        return newArray;
    }

    async updateChat(user: User, data: UpdateChatDTO, id: string) {
        let chat = await this.chat.findByIdAndUpdate(id, data)
        if (!chat) throw new HttpException({ reason: "Unable to upadte chat" }, HttpStatus.FORBIDDEN)

        let chain = await this.chatRagService.getChain(this.llm, data.documents);

        this.logger.debug("Updating Chat");

        this.deleteRagByChat(CHATS, chat.id);

        CHATS.push({
            chat: chat.id,
            rag: chain
        });

        return { 
            message: "Chat update successfully",
            data
        }
    }

    async handleConversations (data: IChat) : Promise<{response: string, status: string}> {
        return {
            response: "Thank you for messaging",
            status: "Successful"
        }
    }

}
