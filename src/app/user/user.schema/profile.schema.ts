import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";

export type ProfileDocument = Profile & Document

@Schema()
export class Profile {
    @Prop() userId: mongoose.Schema.Types.ObjectId;
    @Prop() department: string;
    @Prop() project_title: string;
    @Prop() project_description: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);