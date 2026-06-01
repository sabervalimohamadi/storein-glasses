import {
  BadRequestException, Inject, Injectable,
  Logger, UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
    const rlKey = `otp:rl:${phone}`;

    const attempts = await this.redis.incr(rlKey);
    if (attempts === 1) await this.redis.expire(rlKey, 600);
    if (attempts > 3)
      throw new BadRequestException('درخواست زیاد. ۱۰ دقیقه دیگر تلاش کنید');

    const length = this.configService.get<number>('otp.length')!;
    const ttl = this.configService.get<number>('otp.expiresIn')!;
    const code = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

    await this.redis.setex(`otp:${phone}`, ttl, code);
    await this.smsService.sendOtp(phone, code);
    this.logger.log(`OTP sent → ${phone}`);

    return { message: 'کد تایید ارسال شد', expiresIn: ttl };
  }

  async verifyOtp(dto: VerifyOtpDto, meta: { userAgent?: string; ip?: string }) {
    const phone = this.normalizePhone(dto.phone);
    const key = `otp:${phone}`;
    const stored = await this.redis.get(key);

    if (!stored) throw new UnauthorizedException('کد منقضی شده است');
    if (stored !== dto.code) throw new UnauthorizedException('کد اشتباه است');

    await this.redis.del(key, `otp:rl:${phone}`);

    let user = await this.userModel.findOne({ phone });
    const isNewUser = !user;

    if (!user) {
      user = await this.userModel.create({ phone });
      this.logger.log(`New user: ${phone}`);
    } else if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری غیرفعال است');
    }

    const tokens = await this.issueTokens(user, meta);
    return { ...tokens, isNewUser };
  }

  // ── Tokens ────────────────────────────────────────────────────
  async refreshTokens(userId: string, refreshToken: string, meta: { userAgent?: string; ip?: string }) {
    const doc = await this.rtModel.findOne({
      userId, token: refreshToken, isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
    if (!doc) throw new UnauthorizedException('توکن نامعتبر است');

    const user = await this.userModel.findById(userId);
    if (!user?.isActive) throw new UnauthorizedException('کاربر یافت نشد');

    await this.rtModel.findByIdAndUpdate(doc._id, { isRevoked: true });
    return this.issueTokens(user, meta);
  }

  async logout(userId: string, token: string) {
    await this.rtModel.findOneAndUpdate({ userId, token }, { isRevoked: true });
    return { message: 'خروج موفق' };
  }

  async logoutAll(userId: string) {
    await this.rtModel.updateMany({ userId, isRevoked: false }, { isRevoked: true });
    return { message: 'خروج از همه دستگاه‌ها' };
  }

  // ── Helpers ───────────────────────────────────────────────────
  private async issueTokens(user: UserDocument, meta: { userAgent?: string; ip?: string }) {
    const payload: JwtPayload = { sub: (user._id as any).toString(), phone: user.phone };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret')!,
      expiresIn: this.configService.get('jwt.refreshExpiresIn') as any,
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.rtModel.create({ userId: user._id, token: refreshToken, expiresAt, ...meta });

    return { accessToken, refreshToken };
  }

  private normalizePhone(phone: string): string {
    if (phone.startsWith('+98')) return '0' + phone.slice(3);
    if (phone.startsWith('98')) return '0' + phone.slice(2);
    return phone;
  }
}
