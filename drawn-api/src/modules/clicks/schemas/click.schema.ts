import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClickDocument = Click & Document;

@Schema()
export class Click {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  date: Date; // start of day UTC — bucket key

  @Prop({ default: 0 })
  count: number;
}

export const ClickSchema = SchemaFactory.createForClass(Click);

ClickSchema.index({ userId: 1, date: 1 }, { unique: true });
ClickSchema.index({ date: 1 });
