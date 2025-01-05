import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";

export type UserDocument = User & Document

@Schema()
export class User {
    @Prop() email: string;
    @Prop() name: string;
    @Prop() sub: string;
    @Prop() jwt: string;
    @Prop({ default: true }) is_active: boolean
}

export const UserSchema = SchemaFactory.createForClass(User);