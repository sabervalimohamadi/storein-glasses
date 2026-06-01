import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED      = 'fixed',
}

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: DiscountType, required: true })
  type: DiscountType;

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ default: 0, min: 0 })
  minOrderAmount: number;

  @Prop({ default: 0, min: 0 })
  maxDiscountAmount: number;

  @Prop({ default: 0 })
  usageLimit: number;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ default: 1, min: 1 })
  perUserLimit: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  applicableProducts: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  applicableCategories: Types.ObjectId[];
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
CouponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
