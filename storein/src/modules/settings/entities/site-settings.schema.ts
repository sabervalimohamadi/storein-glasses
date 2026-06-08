import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SiteSettingsDocument = HydratedDocument<SiteSettings>;

class SocialLinks {
  @Prop({ default: '' }) instagram: string;
  @Prop({ default: '' }) telegram:  string;
  @Prop({ default: '' }) twitter:   string;
  @Prop({ default: '' }) whatsapp:  string;
  @Prop({ default: '' }) linkedin:  string;
  @Prop({ default: '' }) youtube:   string;
}

class ThemeSettings {
  @Prop({ default: 'blue' })    preset:       string;
  @Prop({ default: '#3B82F6' }) primaryColor: string;
  @Prop({ default: 'light', enum: ['light', 'dark', 'system'] }) defaultMode: string;

  // Section colors — empty string means "use default"
  @Prop({ default: '' }) navbarBg:     string;
  @Prop({ default: '' }) navbarBorder: string;
  @Prop({ default: '' }) footerBg:     string;
  @Prop({ default: '' }) footerText:   string;
  @Prop({ default: '' }) sidebarBg:    string;
}

class FooterLink {
  @Prop({ default: '' }) label: string;
  @Prop({ default: '' }) url:   string;
}

@Schema({ timestamps: true })
export class SiteSettings {
  // Singleton guard — only one document with key 'default'
  @Prop({ default: 'default', unique: true })
  _key: string;

  // ── General ──────────────────────────────────────────────
  @Prop({ default: 'استورین' })
  siteName: string;

  @Prop({ default: 'فروشگاه تخصصی عینک‌های طبی و آفتابی' })
  tagline: string;

  @Prop({ default: '' })
  logoUrl: string;

  @Prop({ default: '' })
  faviconUrl: string;

  // ── SEO ───────────────────────────────────────────────────
  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  keywords: string;

  @Prop({ default: '' })
  ogImage: string;

  // ── Social ────────────────────────────────────────────────
  @Prop({ type: SocialLinks, default: () => ({}) })
  social: SocialLinks;

  // ── Footer ────────────────────────────────────────────────
  @Prop({ default: '' })
  footerTagline: string;

  @Prop({ default: 'تمامی حقوق برای استورین محفوظ است' })
  footerCopyright: string;

  @Prop({ type: [{ _id: false, label: String, url: String }], default: [] })
  footerLinks: FooterLink[];

  // ── Theme ─────────────────────────────────────────────────
  @Prop({ type: ThemeSettings, default: () => ({ preset: 'blue', primaryColor: '#3B82F6' }) })
  theme: ThemeSettings;

  // ── Contact ───────────────────────────────────────────────
  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: '' })
  address: string;
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
