import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FrameAttributeDocument = FrameAttribute & Document;

@Schema({ timestamps: true })
export class FrameAttribute {
  @Prop({ required: true, enum: ['frameShape', 'frameMaterial'] })
  type: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ required: true, trim: true })
  value: string;

  @Prop({ default: '' })
  icon: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const FrameAttributeSchema = SchemaFactory.createForClass(FrameAttribute);
FrameAttributeSchema.index({ type: 1, value: 1 }, { unique: true });
