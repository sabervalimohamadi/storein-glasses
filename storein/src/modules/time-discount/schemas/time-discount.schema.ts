import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimeDiscountDocument = TimeDiscount & Document;

@Schema({ timestamps: true })
export class TimeDiscount {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  discountType: 'percentage' | 'fixed';

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ type: Number, default: null })
  maxDiscountAmount: number | null;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, enum: ['all', 'products', 'categories'] })
  targetType: 'all' | 'products' | 'categories';

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  targetIds: Types.ObjectId[];

  @Prop({ type: Number, default: null })
  minOrderAmount: number | null;

  @Prop({ type: Number, default: null })
  maxUsageCount: number | null;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const TimeDiscountSchema = SchemaFactory.createForClass(TimeDiscount);

TimeDiscountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
TimeDiscountSchema.index({ targetType: 1, targetIds: 1 });
