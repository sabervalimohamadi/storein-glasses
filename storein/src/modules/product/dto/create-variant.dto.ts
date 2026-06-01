import {
  IsArray, IsBoolean, IsNumber,
  IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantAttributeDto {
  @IsString() key: string;
  @IsString() value: string;
}

export class CreateVariantDto {
  @IsString()
  sku: string;

  @IsNumber() @Min(0)
  price: number;

  @IsOptional() @IsNumber() @Min(0)
  comparePrice?: number;

  @IsOptional() @IsNumber() @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  attributes?: VariantAttributeDto[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
