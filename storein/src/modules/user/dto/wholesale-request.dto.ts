import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class WholesaleRequestDto {
  @IsString() @MinLength(2) @MaxLength(100)
  companyName: string;

  @IsString() @MinLength(10) @MaxLength(11)
  nationalId: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;
}
