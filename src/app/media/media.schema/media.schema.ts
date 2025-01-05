import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";

export type MediaDocument = Media & Document

@Schema()
export class Media {
    @Prop() userId: mongoose.Schema.Types.ObjectId;
    @Prop() url: string;
    @Prop() name: string;
    @Prop() originalname: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);