import {
  IsArray, IsBoolean, IsDateString, IsEnum,
  IsMongoId, IsNumber, IsOptional,
  IsString, MaxLength, Min,
} from 'class-validator';
import { DiscountType } from '../entities/coupon.schema';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsOptional() @IsString() @MaxLength(200)
  description?: string;

  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber() @Min(0)
  value: number;

  @IsOptional() @IsNumber() @Min(0)
  minOrderAmount?: number;

  @IsOptional() @IsNumber() @Min(0)
  maxDiscountAmount?: number;

  @IsOptional() @IsNumber() @Min(0)
  usageLimit?: number;

  @IsOptional() @IsNumber() @Min(1)
  perUserLimit?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsArray() @IsMongoId({ each: true })
  applicableProducts?: string[];

  @IsOptional() @IsArray() @IsMongoId({ each: true })
  applicableCategories?: string[];
}
