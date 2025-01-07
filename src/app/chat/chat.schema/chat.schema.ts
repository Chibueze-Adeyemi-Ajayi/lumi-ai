import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";

export type ChatDocument = Chat & Document

@Schema()
export class Chat {
    @Prop() userId: mongoose.Schema.Types.ObjectId;
    @Prop() title: string;
    @Prop() chats: string[];
    @Prop() documents: string[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);