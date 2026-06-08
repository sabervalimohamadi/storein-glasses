import {
  IsString, IsOptional, MaxLength,
  IsEmail, ValidateNested, IsArray, Matches, IsIn,
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
  @IsString() @MaxLength(60)  label: string;
  @IsString() @MaxLength(200) url:   string;
}

const HEX_OR_EMPTY = /^(#[0-9A-Fa-f]{6})?$/;
const HEX_MSG      = { message: 'رنگ باید فرمت hex معتبر داشته باشد (#RRGGBB)' };

class ThemeDto {
  @IsOptional() @IsString() @MaxLength(30)
  preset?: string;

  @IsOptional() @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'رنگ باید فرمت hex معتبر داشته باشد' })
  primaryColor?: string;

  @IsOptional() @IsIn(['light', 'dark', 'system'])
  defaultMode?: string;

  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) navbarBg?:     string;
  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) navbarBorder?: string;
  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) footerBg?:     string;
  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) footerText?:   string;
  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) sidebarBg?:    string;
}

export class UpdateSettingsDto {
  // General
  @IsOptional() @IsString() @MaxLength(80)  siteName?:   string;
  @IsOptional() @IsString() @MaxLength(120) tagline?:    string;
  @IsOptional() @IsString()                 logoUrl?:    string;
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

  // Theme
  @IsOptional() @ValidateNested() @Type(() => ThemeDto)
  theme?: ThemeDto;
}
