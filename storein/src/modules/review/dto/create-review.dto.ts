import {
  IsArray, IsMongoId, IsNumber,
  IsOptional, IsString, Max,
  MaxLength, Min, MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  productId: string;

  @IsMongoId()
  orderId: string;

  @IsNumber() @Min(1) @Max(5)
  rating: number;

  @IsString() @MinLength(10) @MaxLength(100)
  title: string;

  @IsString() @MinLength(20) @MaxLength(1000)
  body: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  pros?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  cons?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];
}
