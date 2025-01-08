import { ForbiddenException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
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
import { IChat } from 'src/chat-gateway/chat.gateway/chat.gateway.interface';

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

    async getChat(id: string) {
        return this.chat.findById(id);
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
            data: await this.allChats(user)
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

    private async deleteRagByChat(arr: Array<{ chat: string, rag: RunnableSequence<any, string> }>, chatToDelete: string) {
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

    binarySearchChatWithRag(arr: Array<{chat: string, rag: RunnableSequence<any, string>}>, targetChat: string): number | -1 {

        let left = 0;
        let right = arr.length - 1;

        while (left <= right) {

            const mid = Math.floor((left + right) / 2);

            if (arr[mid].chat.toLowerCase() === targetChat.toLowerCase()) {
                return mid; 
            }

            if (arr[mid].chat.toLowerCase() < targetChat.toLowerCase()) {
                left = mid + 1; 
            } else {
                right = mid - 1; 
            }

        }

        return -1; 

    }

    async handleConversations(data: IChat): Promise<{ response: string, status: string }> {

        let { userId, chat, message } = data;
        let _chat = await this.chat.findById(chat);

        if (!_chat) throw new NotFoundException({ message: "This chat id doesn't exist" });
        if (_chat.userId.toString() != userId) throw new ForbiddenException({ message: "Unable to engage in this conversation" });
        if (!message || message == "" || message.replace(" ", "").length < 1) throw new ForbiddenException({ message: "Can't send message" });

        let agent_index = this.binarySearchChatWithRag(CHATS, chat)

        this.logger.debug(`Agent index ${agent_index}`)

        const agent = CHATS[agent_index]["rag"];

        let res = await agent.invoke(message)

        return {
            response: res,
            status: "Successful"
        }

    }

}
