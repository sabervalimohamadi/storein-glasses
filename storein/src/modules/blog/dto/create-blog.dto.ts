import {
  IsString, IsOptional, IsEnum, IsArray,
  MaxLength, MinLength, Matches,
} from 'class-validator';
import { BlogStatus } from '../entities/blog.schema';

export class CreateBlogDto {
  @IsString() @MinLength(3) @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9؀-ۿ-]+$/, { message: 'اسلاگ معتبر نیست' })
  @MaxLength(120)
  slug?: string;

  @IsString() @MinLength(10)
  content: string;

  @IsOptional() @IsString() @MaxLength(500)
  excerpt?: string;

  @IsOptional() @IsString()
  featuredImage?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsEnum(BlogStatus)
  status?: BlogStatus;
}
