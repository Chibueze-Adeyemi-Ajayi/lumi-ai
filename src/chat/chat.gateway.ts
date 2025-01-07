import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger } from '@nestjs/common';
import { ChatService } from 'src/app/chat/chat.service';
import { IChat } from './chat.gateway/chat.gateway.interface';

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;
  
  private logger = new Logger(ChatGateway.name);

  constructor(
    @Inject() private readonly chatService: ChatService
  ) { }

  afterInit(server: any) {
    this.logger.debug("Initailizng Chat Gateway")
  }

  @SubscribeMessage("message")
  async handleChat(@ConnectedSocket() client: Socket, @MessageBody() payload: IChat) {
    this.logger.debug(`New message received: ${payload.chat} - ${payload.message}`);
    // AI processing
    let data = await this.chatService.handleConversations(payload)
    client.emit("response", data); 
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

  handleDisconnect(client: any) {
    this.logger.error("A client just disconnected: ", client)
  }

  handleConnection(client: any, ...args: any[]) {
    this.logger.warn("A client just connected: ", client);
  }

}