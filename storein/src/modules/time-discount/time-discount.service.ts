import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { TimeDiscount, TimeDiscountDocument } from './schemas/time-discount.schema';
import { CreateTimeDiscountDto } from './dto/create-time-discount.dto';
import { UpdateTimeDiscountDto } from './dto/update-time-discount.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const CACHE_KEY = 'active_time_discounts';
const CACHE_TTL = 300;

export interface DiscountPriceResult {
  finalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  activeDiscountId?: string;
}

@Injectable()
export class TimeDiscountService {
  constructor(
    @InjectModel(TimeDiscount.name)
    private readonly discountModel: Model<TimeDiscountDocument>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext('TimeDiscountService');
  }

  async create(dto: CreateTimeDiscountDto): Promise<TimeDiscountDocument> {
    if (new Date(dto.startDate) >= new Date(dto.endDate))
      throw new BadRequestException('تاریخ پایان باید بعد از تاریخ شروع باشد');

    const discount = await this.discountModel.create({
      ...dto,
      targetIds: (dto.targetIds ?? []).map((id) => new Types.ObjectId(id)),
    });

    await this.invalidateCache();
    this.logger.log('TimeDiscount created', { id: (discount._id as any).toString() });
    return discount.toObject();
  }

  async findAll(
    page = 1,
    limit = 20,
    isActive?: boolean,
  ): Promise<{ discounts: TimeDiscountDocument[]; total: number; totalPages: number }> {
    const filter: Record<string, any> = {};
    if (isActive !== undefined) filter.isActive = isActive;

    const skip = (page - 1) * limit;
    const [discounts, total] = await Promise.all([
      this.discountModel
        .find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<TimeDiscountDocument[]>(),
      this.discountModel.countDocuments(filter),
    ]);

    return { discounts, total, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<TimeDiscountDocument> {
    this.assertId(id);
    const discount = await this.discountModel
      .findById(id)
      .select('-__v')
      .lean<TimeDiscountDocument>();
    if (!discount) throw new NotFoundException('تخفیف یافت نشد');
    return discount;
  }

  async update(id: string, dto: UpdateTimeDiscountDto): Promise<TimeDiscountDocument> {
    this.assertId(id);

    if (dto.startDate && dto.endDate && new Date(dto.startDate) >= new Date(dto.endDate))
      throw new BadRequestException('تاریخ پایان باید بعد از تاریخ شروع باشد');

    const updated = await this.discountModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...dto,
            ...(dto.targetIds
              ? { targetIds: dto.targetIds.map((i) => new Types.ObjectId(i)) }
              : {}),
          },
        },
        { new: true, runValidators: true },
      )
      .select('-__v')
      .lean<TimeDiscountDocument>();

    if (!updated) throw new NotFoundException('تخفیف یافت نشد');
    await this.invalidateCache();
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.assertId(id);
    const deleted = await this.discountModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('تخفیف یافت نشد');
    await this.invalidateCache();
  }

  async toggle(id: string): Promise<TimeDiscountDocument> {
    this.assertId(id);
    const discount = await this.discountModel.findById(id);
    if (!discount) throw new NotFoundException('تخفیف یافت نشد');
    discount.isActive = !discount.isActive;
    await discount.save();
    await this.invalidateCache();
    return discount.toObject() as TimeDiscountDocument;
  }

  async getActiveDiscounts(): Promise<TimeDiscountDocument[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
    return this.refreshCache();
  }

  async getActiveDiscountsFromDB(): Promise<TimeDiscountDocument[]> {
    const now = new Date();
    return this.discountModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
          { maxUsageCount: null },
          { $expr: { $lt: ['$usageCount', '$maxUsageCount'] } },
        ],
      })
      .select('-__v')
      .lean<TimeDiscountDocument[]>();
  }

  async refreshCache(): Promise<TimeDiscountDocument[]> {
    const active = await this.getActiveDiscountsFromDB();
    await this.redis.set(CACHE_KEY, JSON.stringify(active), 'EX', CACHE_TTL);
    this.logger.log(`Cache refreshed: ${active.length} active time-discounts`);
    return active;
  }

  async calculateDiscountedPrice(
    originalPrice: number,
    productId: string,
    categoryId: string,
    wholesalePrice?: number,
  ): Promise<DiscountPriceResult> {
    const basePrice = wholesalePrice ?? originalPrice;
    const activeDiscounts = await this.getActiveDiscounts();

    const applicable = activeDiscounts.filter((d) => {
      if (d.targetType === 'all') return true;
      if (d.targetType === 'products')
        return d.targetIds.some((id) => id.toString() === productId);
      if (d.targetType === 'categories')
        return d.targetIds.some((id) => id.toString() === categoryId);
      return false;
    });

    if (!applicable.length)
      return { finalPrice: basePrice, discountAmount: 0, discountPercentage: 0 };

    let best: { amount: number; discount: TimeDiscountDocument } | null = null;

    for (const d of applicable) {
      let amount: number;
      if (d.discountType === 'percentage') {
        const raw = Math.floor((basePrice * d.value) / 100);
        amount = d.maxDiscountAmount ? Math.min(raw, d.maxDiscountAmount) : raw;
      } else {
        amount = Math.min(d.value, basePrice);
      }
      if (!best || amount > best.amount) best = { amount, discount: d };
    }

    const discountAmount = best!.amount;
    const finalPrice = basePrice - discountAmount;
    const discountPercentage = Math.round((discountAmount / basePrice) * 100);

    return {
      finalPrice,
      discountAmount,
      discountPercentage,
      activeDiscountId: (best!.discount._id as any).toString(),
    };
  }

  async incrementUsage(discountId: string): Promise<void> {
    await this.discountModel.findByIdAndUpdate(discountId, {
      $inc: { usageCount: 1 },
    });
  }

  private async invalidateCache(): Promise<void> {
    await this.redis.del(CACHE_KEY);
  }

  private assertId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
  }
}
