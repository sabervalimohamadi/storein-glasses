import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiscountDocument = Discount & Document;

@Schema({ timestamps: true })
export class Discount {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, enum: ['time_limited', 'wholesale'] })
  kind: 'time_limited' | 'wholesale';

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  discountType: 'percentage' | 'fixed';

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ type: Number, default: null })
  maxDiscountAmount: number | null;

  @Prop({ type: Date, default: null })
  startDate: Date | null;

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  @Prop({ required: true, enum: ['all', 'products', 'categories'] })
  targetType: 'all' | 'products' | 'categories';

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  targetIds: Types.ObjectId[];

  @Prop({ type: Number, default: null })
  minOrderAmount: number | null;

  @Prop({ type: Number, default: null })
  minQuantity: number | null;

  @Prop({ type: String, default: null, enum: ['wholesale', 'vip', null] })
  customerGroup: 'wholesale' | 'vip' | null;

  @Prop({ type: Number, default: null })
  maxUsageCount: number | null;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  priority: number;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);

DiscountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
DiscountSchema.index({ kind: 1, isActive: 1 });
DiscountSchema.index({ targetType: 1, targetIds: 1 });
