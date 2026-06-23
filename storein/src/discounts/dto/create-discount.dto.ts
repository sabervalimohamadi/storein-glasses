import {
  IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional,
  IsDateString, IsArray, IsBoolean, Min, ValidateIf,
  registerDecorator, ValidationOptions, ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

export function IsAfterStartDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterStartDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          if (!obj.startDate || !value) return true;
          return new Date(value) > new Date(obj.startDate);
        },
        defaultMessage: () => 'endDate باید بعد از startDate باشد',
      },
    });
  };
}

export class CreateDiscountDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsEnum(['time_limited', 'wholesale'])
  kind: 'time_limited' | 'wholesale';

  @IsEnum(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @IsNumber() @Min(0) @Type(() => Number)
  value: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  maxDiscountAmount?: number;

  @ValidateIf((o) => o.kind === 'time_limited')
  @IsDateString()
  startDate?: string;

  @ValidateIf((o) => o.kind === 'time_limited')
  @IsDateString()
  @IsAfterStartDate({ message: 'endDate باید بعد از startDate باشد' })
  endDate?: string;

  @IsEnum(['all', 'products', 'categories'])
  targetType: 'all' | 'products' | 'categories';

  @IsOptional() @IsArray() @IsString({ each: true })
  targetIds?: string[];

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  minOrderAmount?: number;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  minQuantity?: number;

  @IsOptional() @IsEnum(['wholesale', 'vip'])
  customerGroup?: 'wholesale' | 'vip';

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  maxUsageCount?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  priority?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
