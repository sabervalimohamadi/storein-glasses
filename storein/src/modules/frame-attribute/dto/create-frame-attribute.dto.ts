import { IsString, IsIn, IsBoolean, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateFrameAttributeDto {
  @IsString() @IsIn(['frameShape', 'frameMaterial'])
  type: string;

  @IsString() @MaxLength(50)
  label: string;

  @IsString() @MaxLength(50)
  value: string;

  @IsOptional() @IsString() @MaxLength(10)
  icon?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsNumber()
  sortOrder?: number;
}
