import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";

export type ChatGatewayDocument = ChatGateway & Document

@Schema()
export class ChatGateway {
    @Prop() userId: mongoose.Schema.Types.ObjectId;
    @Prop() socketId: string;
    @Prop({ default: true }) is_active: boolean
}

export const ChatGatewaySchema = SchemaFactory.createForClass(ChatGateway);