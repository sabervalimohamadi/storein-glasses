import {
  BadRequestException, ForbiddenException, Inject, Injectable,
  Logger, UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { SmsService } from './sms/sms.service.abstract';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { User, UserDocument } from '../user/entities/user.schema';
import { RefreshToken, RefreshTokenDocument } from './entities/refresh-token.schema';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name) private rtModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  // ── OTP ──────────────────────────────────────────────────────
  async sendOtp(dto: SendOtpDto) {
    const phone = this.normalizePhone(dto.phone);

    // Block check before doing anything (don't waste SMS quota on blocked users)
    const existingUser = await this.userModel.findOne({ phone }).select('isActive').lean();
    if (existingUser && !existingUser.isActive) {
      this.logger.warn(`OTP blocked — inactive user: ${this.maskPhone(phone)}`);
      throw new ForbiddenException('حساب کاربری شما مسدود شده است. با پشتیبانی سایت تماس بگیرید');
    }

    const rlKey = `otp:rl:${phone}`;
    const attempts = await this.redis.incr(rlKey);
    if (attempts === 1) await this.redis.expire(rlKey, 600);
    if (attempts > 3) {
      this.logger.warn(`OTP rate-limit hit: ${this.maskPhone(phone)} (attempts=${attempts})`);
      throw new BadRequestException('درخواست زیاد. ۱۰ دقیقه دیگر تلاش کنید');
    }

    const length = this.configService.get<number>('otp.length')!;
    const ttl = this.configService.get<number>('otp.expiresIn')!;
    const code = Array.from({ length }, () => randomInt(0, 10)).join('');

    await this.redis.setex(`otp:${phone}`, ttl, code);
    await this.smsService.sendOtp(phone, code);
    this.logger.log(`OTP sent → ${this.maskPhone(phone)}`);

    return { message: 'کد تایید ارسال شد', expiresIn: ttl };
  }

  async verifyOtp(dto: VerifyOtpDto, meta: { userAgent?: string; ip?: string }) {
    const phone   = this.normalizePhone(dto.phone);
    const key     = `otp:${phone}`;
    const verifyKey = `otp:verify:${phone}`;

    // Brute-force guard: max 5 attempts per OTP window (300 s)
    const attempts = await this.redis.incr(verifyKey);
    if (attempts === 1) await this.redis.expire(verifyKey, 300);
    if (attempts > 5) {
      this.logger.warn(`OTP verify rate-limit: ${this.maskPhone(phone)} (attempts=${attempts})`);
      throw new BadRequestException('تعداد تلاش‌های اشتباه زیاد است. ۵ دقیقه دیگر تلاش کنید');
    }

    const stored = await this.redis.get(key);

    if (!stored) {
      this.logger.warn(`OTP expired: ${this.maskPhone(phone)}`);
      throw new UnauthorizedException('کد منقضی شده است');
    }
    if (stored !== dto.code) {
      this.logger.warn(`OTP mismatch: ${this.maskPhone(phone)}`);
      throw new UnauthorizedException('کد اشتباه است');
    }

    await this.redis.del(key, `otp:rl:${phone}`, verifyKey);

    let user = await this.userModel.findOne({ phone });
    const isNewUser = !user;

    if (!user) {
      user = await this.userModel.create({ phone });
      this.logger.log(`New user registered: ${this.maskPhone(phone)}`);
    } else if (!user.isActive) {
      this.logger.warn(`Login blocked — inactive user: ${this.maskPhone(phone)}`);
      throw new UnauthorizedException('حساب کاربری غیرفعال است');
    }

    const tokens = await this.issueTokens(user, meta);
    this.logger.log(`OTP verified — user logged in: ${this.maskPhone(phone)}`);
    return { ...tokens, isNewUser };
  }

  // ── Tokens ────────────────────────────────────────────────────
  async refreshTokens(userId: string, refreshToken: string, meta: { userAgent?: string; ip?: string }) {
    // Find a non-revoked, non-expired token record for this user
    const candidates = await this.rtModel.find({
      userId, isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
    let doc: RefreshTokenDocument | null = null;
    for (const candidate of candidates) {
      if (await bcrypt.compare(refreshToken, candidate.token)) {
        doc = candidate;
        break;
      }
    }
    if (!doc) {
      this.logger.warn(`Refresh token invalid/expired: userId=${userId}`);
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    const user = await this.userModel.findById(userId);
    if (!user?.isActive) {
      this.logger.warn(`Refresh blocked — inactive user: userId=${userId}`);
      throw new UnauthorizedException('کاربر یافت نشد');
    }

    await this.rtModel.findByIdAndUpdate(doc._id, { isRevoked: true });
    return this.issueTokens(user, meta);
  }

  async logout(userId: string, token: string) {
    // Must compare hash since tokens are stored hashed
    const active = await this.rtModel.find({ userId, isRevoked: false });
    for (const doc of active) {
      if (await bcrypt.compare(token, doc.token)) {
        await this.rtModel.findByIdAndUpdate(doc._id, { isRevoked: true });
        break;
      }
    }
    return { message: 'خروج موفق' };
  }

  async logoutAll(userId: string) {
    await this.rtModel.updateMany({ userId, isRevoked: false }, { isRevoked: true });
    return { message: 'خروج از همه دستگاه‌ها' };
  }

  // ── Helpers ───────────────────────────────────────────────────
  private async issueTokens(user: HydratedDocument<User>, meta: { userAgent?: string; ip?: string }) {
    const payload: JwtPayload = { sub: user._id.toString(), phone: user.phone };

    const accessToken  = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret:    this.configService.get<string>('jwt.refreshSecret')!,
      expiresIn: this.configService.get('jwt.refreshExpiresIn') as any,
    });

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.rtModel.create({ userId: user._id, token: hashedToken, expiresAt, ...meta });

    return { accessToken, refreshToken };
  }

  private normalizePhone(phone: string): string {
    if (phone.startsWith('+98')) return '0' + phone.slice(3);
    if (phone.startsWith('98')) return '0' + phone.slice(2);
    return phone;
  }

  private maskPhone(phone: string): string {
    return phone.length > 4 ? phone.slice(0, -4) + '****' : '****';
  }
}
