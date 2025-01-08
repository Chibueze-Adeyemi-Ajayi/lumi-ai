import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { ChatService } from 'src/app/chat/chat.service';
import { IChat } from './chat.gateway/chat.gateway.interface';
import { UserService } from 'src/app/user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatGateway, ChatGatewayDocument } from './chat.gateway.schema/chat.gateway.schema';

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true
  }
})
export class WSChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;
  
  private logger = new Logger(WSChatGateway.name);

  constructor( 
    @Inject() private readonly chatService: ChatService,
    @Inject() private readonly userService: UserService,
    // @InjectModel(ChatGateway.name) private readonly chatGateway: Model<ChatGatewayDocument>
  ) { }

  afterInit(server: any) {
    this.logger.debug("Initailizng Chat Gateway")
  }

  @SubscribeMessage("message")
  async handleChat(@ConnectedSocket() client: Socket, @MessageBody() payload: IChat) {
    try {
      this.logger.debug(`New message received: ${payload.chat} - ${payload.message}`);
      // AI processing
      let data = await this.chatService.handleConversations(payload)
      client.emit("response", data);
    } catch (error) {
      this.logger.error(error);
      throw new WsException(error);
    } 
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string): void {
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('sendMessageToRoom')
  handleSendMessageToRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string; message: string }): void {
    this.server.to(data.room).emit('roomMessage', data.message);
  }

  async handleDisconnect(client: Socket) {
    // let chatGateway = await this.chatGateway.findOne({socketId: client.id});
    // if (chatGateway) await this.chatGateway.findByIdAndDelete(chatGateway.socketId)
    this.logger.error("A client just disconnected: ", client)
  }

  async handleConnection(client: Socket, ...args: any[]) {
    let socket_id = client.id, headers = client.handshake.headers;
    let { authorization } = headers;
    // this.logger.debug(authorization)
    let user = await this.userService.getUser(authorization);
    if (!user) client.disconnect(true)
    // await (new this.chatGateway({userId: user.id, socketId: socket_id})).save();
    // emit all chats
    let chats = await this.chatService.allChats(user);
    client.emit("chat", chats);
    this.logger.warn("A client just connected: ", client);
  }

}