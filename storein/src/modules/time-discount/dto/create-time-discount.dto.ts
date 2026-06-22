import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsEndDateAfterStartDate } from '../validators/date-range.validator';

export class CreateTimeDiscountDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.discountType === 'percentage')
  @Max(100)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsEndDateAfterStartDate('startDate', { message: 'تاریخ پایان باید بعد از تاریخ شروع باشد' })
  endDate: string;

  @IsEnum(['all', 'products', 'categories'])
  targetType: 'all' | 'products' | 'categories';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetIds?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxUsageCount?: number;
}
