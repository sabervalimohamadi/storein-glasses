import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Discount, DiscountDocument } from './schemas/discount.schema';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';

const CACHE_KEY = 'active_discounts';
const CACHE_TTL = 300;

export interface DiscountPriceResult {
  finalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  activeDiscount: { id: string; endDate: Date | null } | null;
}

export interface PaginatedDiscounts {
  discounts: DiscountDocument[];
  total: number;
  totalPages: number;
}

@Injectable()
export class DiscountsService {
  constructor(
    @InjectModel(Discount.name)
    private readonly discountModel: Model<DiscountDocument>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext('DiscountsService');
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(dto: CreateDiscountDto): Promise<DiscountDocument> {
    if (dto.kind === 'time_limited') {
      if (!dto.startDate || !dto.endDate)
        throw new BadRequestException('startDate و endDate برای تخفیف زمان‌دار الزامی است');
      if (new Date(dto.startDate) >= new Date(dto.endDate))
        throw new BadRequestException('تاریخ پایان باید بعد از تاریخ شروع باشد');
    }

    const discount = await this.discountModel.create({
      ...dto,
      targetIds: (dto.targetIds ?? []).map((id) => new Types.ObjectId(id)),
      maxDiscountAmount: dto.maxDiscountAmount ?? null,
      minOrderAmount: dto.minOrderAmount ?? null,
      minQuantity: dto.minQuantity ?? null,
      customerGroup: dto.customerGroup ?? null,
      maxUsageCount: dto.maxUsageCount ?? null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      priority: dto.priority ?? 0,
    });

    await this.invalidateCache();
    this.logger.log('Discount created', {
      id: (discount._id as any).toString(),
      kind: dto.kind,
      title: dto.title,
    });
    return discount.toObject() as DiscountDocument;
  }

  async findAll(query: {
    page: number;
    limit: number;
    isActive?: boolean;
    kind?: string;
  }): Promise<PaginatedDiscounts> {
    const { page = 1, limit = 20, isActive, kind } = query;
    const filter: Record<string, any> = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (kind) filter.kind = kind;

    const skip = (page - 1) * limit;
    const [discounts, total] = await Promise.all([
      this.discountModel
        .find(filter)
        .select('-__v')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<DiscountDocument[]>(),
      this.discountModel.countDocuments(filter),
    ]);

    return { discounts, total, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<DiscountDocument> {
    this.assertId(id);
    const discount = await this.discountModel
      .findById(id)
      .select('-__v')
      .lean<DiscountDocument>();
    if (!discount) throw new NotFoundException('تخفیف یافت نشد');
    return discount;
  }

  async update(id: string, dto: UpdateDiscountDto): Promise<DiscountDocument> {
    this.assertId(id);

    if (dto.kind === 'time_limited' && dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate))
        throw new BadRequestException('تاریخ پایان باید بعد از تاریخ شروع باشد');
    }

    const updateData: Record<string, any> = { ...dto };
    if (dto.targetIds) updateData.targetIds = dto.targetIds.map((i) => new Types.ObjectId(i));
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;

    const updated = await this.discountModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .select('-__v')
      .lean<DiscountDocument>();

    if (!updated) throw new NotFoundException('تخفیف یافت نشد');
    await this.invalidateCache();
    this.logger.log('Discount updated', { id });
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    this.assertId(id);
    const result = await this.discountModel.findByIdAndUpdate(id, { $set: { isActive: false } });
    if (!result) throw new NotFoundException('تخفیف یافت نشد');
    await this.invalidateCache();
    this.logger.log('Discount soft-deleted', { id });
  }

  async toggle(id: string): Promise<DiscountDocument> {
    this.assertId(id);
    const discount = await this.discountModel.findById(id);
    if (!discount) throw new NotFoundException('تخفیف یافت نشد');
    discount.isActive = !discount.isActive;
    await discount.save();
    await this.invalidateCache();
    this.logger.log('Discount toggled', { id, isActive: discount.isActive });
    return discount.toObject() as DiscountDocument;
  }

  // ── Core Logic ─────────────────────────────────────────────────────────────

  async getActiveDiscounts(): Promise<DiscountDocument[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
    return this.refreshCache();
  }

  async refreshCache(): Promise<DiscountDocument[]> {
    const now = new Date();
    const active = await this.discountModel
      .find({
        isActive: true,
        $or: [
          { kind: 'wholesale' },
          {
            kind: 'time_limited',
            startDate: { $lte: now },
            endDate: { $gte: now },
            $or: [
              { maxUsageCount: null },
              { $expr: { $lt: ['$usageCount', '$maxUsageCount'] } },
            ],
          },
        ],
      })
      .select('-__v')
      .lean<DiscountDocument[]>();

    await this.redis.set(CACHE_KEY, JSON.stringify(active), 'EX', CACHE_TTL);
    this.logger.log(`Cache refreshed: ${active.length} active discounts`);
    return active;
  }

  async calculateDiscountedPrice(params: {
    originalPrice: number;
    wholesalePrice?: number;
    productId: string;
    categoryId: string;
    customerGroup?: 'wholesale' | 'vip';
    quantity?: number;
  }): Promise<DiscountPriceResult> {
    const { originalPrice, wholesalePrice, productId, categoryId, customerGroup, quantity } = params;

    const isWholesaleCustomer = customerGroup === 'wholesale' || customerGroup === 'vip';
    const basePrice = isWholesaleCustomer && wholesalePrice ? wholesalePrice : originalPrice;

    const activeDiscounts = await this.getActiveDiscounts();
    const now = new Date();

    const applicable = activeDiscounts.filter((d) => {
      const targetMatch =
        d.targetType === 'all' ||
        (d.targetType === 'products' && d.targetIds.some((id) => id.toString() === productId)) ||
        (d.targetType === 'categories' && d.targetIds.some((id) => id.toString() === categoryId));

      if (!targetMatch) return false;

      if (d.kind === 'time_limited') {
        if (!d.startDate || !d.endDate) return false;
        return now >= new Date(d.startDate) && now <= new Date(d.endDate);
      }

      if (d.kind === 'wholesale') {
        if (!isWholesaleCustomer) return false;
        if (d.customerGroup && d.customerGroup !== customerGroup) return false;
        if (d.minQuantity && (!quantity || quantity < d.minQuantity)) return false;
        return true;
      }

      return false;
    });

    if (!applicable.length) {
      return { finalPrice: basePrice, discountAmount: 0, discountPercentage: 0, activeDiscount: null };
    }

    let best: { amount: number; discount: DiscountDocument; priority: number } | null = null;

    for (const d of applicable) {
      let amount: number;
      if (d.discountType === 'percentage') {
        const raw = Math.floor((basePrice * d.value) / 100);
        amount = d.maxDiscountAmount ? Math.min(raw, d.maxDiscountAmount) : raw;
      } else {
        amount = Math.min(d.value, basePrice);
      }

      const prio = d.priority ?? 0;
      if (
        !best ||
        prio > best.priority ||
        (prio === best.priority && amount > best.amount)
      ) {
        best = { amount, discount: d, priority: prio };
      }
    }

    const discountAmount = best!.amount;
    const finalPrice = Math.max(0, basePrice - discountAmount);
    const discountPercentage = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

    return {
      finalPrice,
      discountAmount,
      discountPercentage,
      activeDiscount: {
        id: (best!.discount._id as any).toString(),
        endDate: best!.discount.endDate ?? null,
      },
    };
  }

  async invalidateCache(): Promise<void> {
    await this.redis.del(CACHE_KEY);
  }

  async incrementUsage(discountId: string): Promise<void> {
    await this.discountModel.updateOne(
      { _id: new Types.ObjectId(discountId) },
      { $inc: { usageCount: 1 } },
    );
  }

  private assertId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
  }
}
