import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument, DiscountType } from './entities/coupon.schema';
import { CouponUsage, CouponUsageDocument } from './entities/coupon-usage.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

export interface CouponValidateResult {
  isValid:        boolean;
  discountAmount: number;
  message:        string;
  coupon?:        CouponDocument;
}

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel(Coupon.name)      private couponModel: Model<CouponDocument>,
    @InjectModel(CouponUsage.name) private usageModel:  Model<CouponUsageDocument>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext('DiscountService');
  }

  // ── Core: Calculate Discount ──────────────────────────────────
  calcDiscount(coupon: CouponDocument, cartTotal: number): number {
    if (coupon.type === DiscountType.PERCENTAGE) {
      const raw = Math.floor((cartTotal * coupon.value) / 100);
      return coupon.maxDiscountAmount > 0
        ? Math.min(raw, coupon.maxDiscountAmount)
        : raw;
    }
    return Math.min(coupon.value, cartTotal);
  }

  // ── Validate (read-only — no side effects) ────────────────────
  async validate(
    userId: string,
    code: string,
    cartTotal: number,
  ): Promise<CouponValidateResult> {
    const coupon = await this.couponModel
      .findOne({ code: code.toUpperCase().trim() })
      .lean<CouponDocument>();

    if (!coupon)
      return { isValid: false, discountAmount: 0, message: 'کد تخفیف یافت نشد' };

    if (!coupon.isActive)
      return { isValid: false, discountAmount: 0, message: 'کد تخفیف غیرفعال است' };

    const now = new Date();
    if (now < coupon.startDate)
      return { isValid: false, discountAmount: 0, message: 'کد تخفیف هنوز فعال نشده است' };
    if (now > coupon.endDate) {
      this.logger.warn('Coupon expired', { code, userId, endDate: coupon.endDate });
      return { isValid: false, discountAmount: 0, message: 'کد تخفیف منقضی شده است' };
    }

    if (coupon.minOrderAmount > 0 && cartTotal < coupon.minOrderAmount)
      return {
        isValid: false,
        discountAmount: 0,
        message: `حداقل مبلغ سفارش برای این کد: ${coupon.minOrderAmount.toLocaleString()} تومان`,
      };

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      this.logger.warn('Coupon usage limit reached', { code, usageCount: coupon.usageCount, usageLimit: coupon.usageLimit });
      return { isValid: false, discountAmount: 0, message: 'ظرفیت کد تخفیف تکمیل شده است' };
    }

    const userUsage = await this.usageModel.countDocuments({
      couponId: coupon._id,
      userId:   new Types.ObjectId(userId),
    });
    if (userUsage >= coupon.perUserLimit) {
      this.logger.warn('Coupon already used by user', { code, userId });
      return { isValid: false, discountAmount: 0, message: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید' };
    }

    const discountAmount = this.calcDiscount(coupon, cartTotal);

    return {
      isValid: true,
      discountAmount,
      message: `تخفیف ${discountAmount.toLocaleString()} تومان اعمال می‌شود`,
      coupon:  coupon as CouponDocument,
    };
  }

  // ── Record Usage (called by OrderService after order created) ─
  async recordUsage(
    couponId: Types.ObjectId,
    userId: string,
    orderId: string,
    discountAmount: number,
  ): Promise<void> {
    await this.couponModel.findByIdAndUpdate(couponId, {
      $inc: { usageCount: 1 },
    });
    await this.usageModel.create({
      couponId,
      userId:         new Types.ObjectId(userId),
      orderId:        new Types.ObjectId(orderId),
      discountAmount,
    });
  }

  // ── Admin CRUD ────────────────────────────────────────────────
  async adminCreate(dto: CreateCouponDto): Promise<CouponDocument> {
    const exists = await this.couponModel.exists({
      code: dto.code.toUpperCase().trim(),
    });
    if (exists) throw new ConflictException('این کد تخفیف قبلاً ثبت شده است');

    if (new Date(dto.startDate) >= new Date(dto.endDate))
      throw new BadRequestException('تاریخ شروع باید قبل از تاریخ پایان باشد');

    if (dto.type === DiscountType.PERCENTAGE && dto.value > 100)
      throw new BadRequestException('درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد');

    const coupon = await this.couponModel.create({
      ...dto,
      code:                 dto.code.toUpperCase().trim(),
      applicableProducts:   (dto.applicableProducts ?? []).map(
        (id) => new Types.ObjectId(id),
      ),
      applicableCategories: (dto.applicableCategories ?? []).map(
        (id) => new Types.ObjectId(id),
      ),
    });

    this.logger.log('Coupon created', {
      couponId: (coupon._id as any).toString(),
      code:     coupon.code,
      type:     coupon.type,
      value:    coupon.value,
    });

    return coupon.toObject();
  }

  async adminFindAll(
    page = 1,
    limit = 20,
    isActive?: boolean,
    search?: string,
  ): Promise<{ coupons: CouponDocument[]; total: number; totalPages: number }> {
    const filter: Record<string, any> = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (search?.trim()) filter.code = { $regex: search.trim(), $options: 'i' };

    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      this.couponModel
        .find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<CouponDocument[]>(),
      this.couponModel.countDocuments(filter),
    ]);

    return { coupons, total, totalPages: Math.ceil(total / limit) };
  }

  async adminFindById(id: string): Promise<CouponDocument> {
    this.assertId(id);
    const coupon = await this.couponModel
      .findById(id)
      .select('-__v')
      .lean<CouponDocument>();
    if (!coupon) throw new NotFoundException('کوپن یافت نشد');
    return coupon;
  }

  async adminUpdate(id: string, dto: UpdateCouponDto): Promise<CouponDocument> {
    this.assertId(id);

    if (dto.code) {
      const dup = await this.couponModel.exists({
        code: dto.code.toUpperCase().trim(),
        _id:  { $ne: new Types.ObjectId(id) },
      });
      if (dup) throw new ConflictException('این کد تخفیف قبلاً ثبت شده است');
      dto.code = dto.code.toUpperCase().trim();
    }

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate))
        throw new BadRequestException('تاریخ شروع باید قبل از تاریخ پایان باشد');
    }

    const updated = await this.couponModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .select('-__v')
      .lean<CouponDocument>();

    if (!updated) throw new NotFoundException('کوپن یافت نشد');
    return updated;
  }

  async adminToggle(id: string): Promise<CouponDocument> {
    this.assertId(id);
    const coupon = await this.couponModel.findById(id).select('-__v');
    if (!coupon) throw new NotFoundException('کوپن یافت نشد');
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    this.logger.log('Coupon toggled', { couponId: id, code: coupon.code, isActive: coupon.isActive });
    return coupon.toObject() as CouponDocument;
  }

  async adminDelete(id: string): Promise<void> {
    this.assertId(id);
    const coupon = await this.couponModel.findByIdAndDelete(id);
    if (!coupon) throw new NotFoundException('کوپن یافت نشد');
    this.logger.log('Coupon deleted', { couponId: id, code: coupon.code });
  }

  async adminDeactivate(id: string): Promise<CouponDocument> {
    this.assertId(id);
    const coupon = await this.couponModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .select('-__v')
      .lean<CouponDocument>();
    if (!coupon) throw new NotFoundException('کوپن یافت نشد');
    this.logger.log('Coupon deactivated', { couponId: id, code: coupon.code });
    return coupon;
  }

  async adminGetUsage(
    couponId: string,
    page = 1,
    limit = 20,
  ): Promise<{ usages: CouponUsageDocument[]; total: number }> {
    this.assertId(couponId);
    const filter = { couponId: new Types.ObjectId(couponId) };
    const skip   = (page - 1) * limit;

    const [usages, total] = await Promise.all([
      this.usageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'phone firstName lastName')
        .populate('orderId', 'orderNumber total')
        .lean<CouponUsageDocument[]>(),
      this.usageModel.countDocuments(filter),
    ]);

    return { usages, total };
  }

  private assertId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
  }
}
