import {
  IsString, IsOptional, IsUrl, MaxLength,
  IsEmail, ValidateNested, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

class SocialLinksDto {
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() telegram?:  string;
  @IsOptional() @IsString() twitter?:   string;
  @IsOptional() @IsString() whatsapp?:  string;
  @IsOptional() @IsString() linkedin?:  string;
  @IsOptional() @IsString() youtube?:   string;
}

class FooterLinkDto {
  @IsString() @MaxLength(60) label: string;
  @IsString() @MaxLength(200) url:  string;
}

export class UpdateSettingsDto {
  // General
  @IsOptional() @IsString() @MaxLength(80)  siteName?:  string;
  @IsOptional() @IsString() @MaxLength(120) tagline?:   string;
  @IsOptional() @IsString()                 logoUrl?:   string;
  @IsOptional() @IsString()                 faviconUrl?: string;

  // SEO
  @IsOptional() @IsString() @MaxLength(160) description?: string;
  @IsOptional() @IsString() @MaxLength(250) keywords?:    string;
  @IsOptional() @IsString()                 ogImage?:     string;

  // Social
  @IsOptional() @ValidateNested() @Type(() => SocialLinksDto)
  social?: SocialLinksDto;

  // Footer
  @IsOptional() @IsString() @MaxLength(120) footerTagline?:   string;
  @IsOptional() @IsString() @MaxLength(120) footerCopyright?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FooterLinkDto)
  footerLinks?: FooterLinkDto[];

  // Contact
  @IsOptional() @IsString() @MaxLength(20)  phone?:   string;
  @IsOptional() @IsEmail()                  email?:   string;
  @IsOptional() @IsString() @MaxLength(200) address?: string;
}
