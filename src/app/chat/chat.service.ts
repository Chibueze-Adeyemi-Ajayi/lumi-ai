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
import { promptTemplates } from './chat.prompts/chat.prompt';
import { Socket } from 'socket.io';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

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
            temperature: .7,
            maxRetries: 5
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

    private parseTextToDocx(text: string): any[] {
        const docxElements: any[] = [];
        const paragraphs = text.split(/\n+/); // Split by one or more newlines

        for (const paragraphText of paragraphs) {
            if (paragraphText.trim() !== "") { // Skip empty paragraphs
                docxElements.push(new Paragraph({
                    children: [new TextRun(paragraphText.trim())],
                }));
            }
        }
        return docxElements;
    }

    private async createWordDocumentFromText(text: string): Promise<Buffer | null> {
        try {
            const doc = new Document({
                styles: {
                    paragraphStyles: [
                        {
                        id: "normal",
                        name: "Normal",
                        basedOn: "Normal",
                        next: "Normal",
                        uiPriority: 10,
                        run: {
                            font: "Times New Roman",
                            size: 24, // Half-point size (12pt font)
                            color: "000000", // Black
                        },
                        paragraph: {
                            spacing: {
                                line: 480, // 24 * 20 = 480 (2.0 line spacing)
                            },
                            alignment: "both",
                        },
                    }
                    ]
                },
                sections: [{
                    properties: {
                        page: {
                            margin: {
                                top: "5cm",
                                bottom: "5cm",
                                left: "5cm",
                                right: "5cm"
                            }
                        }
                    },
                    children: this.parseTextToDocx(text),
                }],
            });

            return await Packer.toBuffer(doc);
        } catch (error) {
            console.error("Error creating document:", error);
            return null;
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

        let agent_index = this.binarySearchChatWithRag(CHATS, chat.id)
        CHATS[agent_index] = {
            chat: chat.id,
            rag: chain
        }

        this.logger.debug("Updating Chat");

        // this.deleteRagByChat(CHATS, chat.id);

        // CHATS.push({
        //     chat: chat.id,
        //     rag: chain
        // });

        return {
            message: "Chat update successfully",
            data
        }
    }

    binarySearchChatWithRag(arr: Array<{ chat: string, rag: RunnableSequence<any, string> }>, targetChat: string): number | -1 {

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

    private cleanText(text: string): string {
        text = text.replace(/^#+\s/gm, '');
        text = text.replace(/<[^>]*>/g, '');
        text = text.replace(/\n+/g, `<br>`);
        return text.trim();
    }

    async handleCustomConversations(data: IChat, template_id: string, client: Socket) {

        let { userId, chat, message } = data;
        let _chat = await this.chat.findById(chat);

        if (!_chat) throw new NotFoundException({ message: "This chat id doesn't exist" });
        if (_chat.userId.toString() != userId) throw new ForbiddenException({ message: "Unable to engage in this conversation" });

        let template = promptTemplates[`${template_id}`];
        if (!template) throw new NotFoundException({ message: "Template not implemented yet" });
        let steps = template[0]["steps"]; const responses = [];

        let agent_index = this.binarySearchChatWithRag(CHATS, chat)

        this.logger.debug(`Agent index ${agent_index}`)

        const agent = CHATS[agent_index]["rag"];
        let chats = _chat.chats;

        for (const step of steps) {
            let { name, prompt, length } = step;
            this.logger.debug(`Prompting step: ${name}`);
            let content = await agent.invoke(`${prompt}`);
            content = this.cleanText(content);
            let data = { content, section: this.createWordDocumentFromText(name) }
            client.emit("response", data);
            responses.push(content);
        }

        // let res = await agent.invoke(`${message} <history>${chats.reverse().toString()}</history>`);
        const flattened_response = responses.flat(Infinity);
        // log(flattened_response);
        (<any>chats).push({
            user: message, ai: flattened_response
        });

        // let docs = await this.chatRagService.raw_docs(_chat)

        // await this.chat.findByIdAndUpdate(_chat.id, { chats })

        return {
            response: responses,
            status: "Successful"
        }

    }

    async handleConversations(data: IChat): Promise<{ response: string | any[], status: string }> {

        let { userId, chat, message } = data;
        let _chat = await this.chat.findById(chat);

        if (!_chat) throw new NotFoundException({ message: "This chat id doesn't exist" });
        if (_chat.userId.toString() != userId) throw new ForbiddenException({ message: "Unable to engage in this conversation" });
        if (!message || message == "" || message.replace(" ", "").length < 1) throw new ForbiddenException({ message: "Can't send message" });

        let agent_index = this.binarySearchChatWithRag(CHATS, chat)

        this.logger.debug(`Agent index ${agent_index}`)

        const agent = CHATS[agent_index]["rag"];
        let chats = _chat.chats;

        let res = await agent.invoke(`${message} <history>${chats.reverse().toString()}</history>`);
        (<any>chats).push({
            user: message, ai: res
        })
        // let docs = await this.chatRagService.raw_docs(_chat)

        // await this.chat.findByIdAndUpdate(_chat.id, { chats })

        return {
            response: res,
            status: "Successful"
        }

    }

}
