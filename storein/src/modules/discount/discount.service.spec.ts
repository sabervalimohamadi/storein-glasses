import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DiscountService } from './discount.service';
import { Coupon, DiscountType } from './entities/coupon.schema';
import { CouponUsage } from './entities/coupon-usage.schema';

const userId   = new Types.ObjectId().toString();
const couponId = new Types.ObjectId();

const now    = new Date();
const past   = new Date(now.getTime() - 86400_000);
const future = new Date(now.getTime() + 86400_000);

const mockCoupon = (overrides: any = {}) => ({
  _id:                  couponId,
  code:                 'SAVE20',
  type:                 DiscountType.PERCENTAGE,
  value:                20,
  minOrderAmount:       0,
  maxDiscountAmount:    0,
  usageLimit:           0,
  usageCount:           0,
  perUserLimit:         1,
  startDate:            past,
  endDate:              future,
  isActive:             true,
  applicableProducts:   [],
  applicableCategories: [],
  ...overrides,
});

describe('DiscountService', () => {
  let service: DiscountService;
  let couponModel: any;
  let usageModel: any;

  beforeEach(async () => {
    couponModel = {
      findOne:           jest.fn(),
      exists:            jest.fn().mockResolvedValue(null),
      find:              jest.fn(),
      findById:          jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findOneAndUpdate:  jest.fn(),
      countDocuments:    jest.fn().mockResolvedValue(0),
      create:            jest.fn(),
    };

    usageModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      create:         jest.fn().mockResolvedValue({}),
      find:           jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountService,
        { provide: getModelToken(Coupon.name),      useValue: couponModel },
        { provide: getModelToken(CouponUsage.name), useValue: usageModel },
      ],
    }).compile();

    service = module.get(DiscountService);
    jest.clearAllMocks();
  });

  // ── calcDiscount ──────────────────────────────────────────────
  describe('calcDiscount', () => {
    it('calculates percentage discount', () => {
      const coupon = mockCoupon({ type: DiscountType.PERCENTAGE, value: 20 });
      expect(service.calcDiscount(coupon as any, 10_000_000)).toBe(2_000_000);
    });

    it('caps percentage discount at maxDiscountAmount', () => {
      const coupon = mockCoupon({
        type: DiscountType.PERCENTAGE, value: 50, maxDiscountAmount: 1_000_000,
      });
      expect(service.calcDiscount(coupon as any, 10_000_000)).toBe(1_000_000);
    });

    it('calculates fixed discount', () => {
      const coupon = mockCoupon({ type: DiscountType.FIXED, value: 500_000 });
      expect(service.calcDiscount(coupon as any, 10_000_000)).toBe(500_000);
    });

    it('caps fixed discount at cart total', () => {
      const coupon = mockCoupon({ type: DiscountType.FIXED, value: 5_000_000 });
      expect(service.calcDiscount(coupon as any, 2_000_000)).toBe(2_000_000);
    });
  });

  // ── validate ──────────────────────────────────────────────────
  describe('validate', () => {
    it('returns valid result with discount amount', async () => {
      couponModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCoupon()),
      });
      usageModel.countDocuments.mockResolvedValue(0);

      const res = await service.validate(userId, 'SAVE20', 10_000_000);
      expect(res.isValid).toBe(true);
      expect(res.discountAmount).toBe(2_000_000);
    });

    it('returns invalid when coupon not found', async () => {
      couponModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      const res = await service.validate(userId, 'BAD', 10_000_000);
      expect(res.isValid).toBe(false);
    });

    it('returns invalid when coupon expired', async () => {
      couponModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCoupon({ endDate: past })),
      });
      const res = await service.validate(userId, 'SAVE20', 10_000_000);
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('منقضی');
    });

    it('returns invalid when cart below minOrderAmount', async () => {
      couponModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCoupon({ minOrderAmount: 5_000_000 })),
      });
      const res = await service.validate(userId, 'SAVE20', 1_000_000);
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('حداقل');
    });

    it('returns invalid when usage limit reached', async () => {
      couponModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCoupon({ usageLimit: 10, usageCount: 10 })),
      });
      const res = await service.validate(userId, 'SAVE20', 10_000_000);
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('ظرفیت');
    });

    it('returns invalid when user already used this coupon', async () => {
      couponModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCoupon({ perUserLimit: 1 })),
      });
      usageModel.countDocuments.mockResolvedValue(1);

      const res = await service.validate(userId, 'SAVE20', 10_000_000);
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('قبلاً');
    });
  });

  // ── adminCreate ───────────────────────────────────────────────
  describe('adminCreate', () => {
    const dto = {
      code: 'NEWCODE', type: DiscountType.FIXED, value: 100_000,
      startDate: past.toISOString(), endDate: future.toISOString(),
    };

    it('creates coupon successfully', async () => {
      couponModel.exists.mockResolvedValue(null);
      couponModel.create.mockResolvedValue({
        ...mockCoupon({ code: 'NEWCODE' }),
        toObject: () => mockCoupon({ code: 'NEWCODE' }),
      });

      const res = await service.adminCreate(dto as any);
      expect(res.code).toBe('NEWCODE');
      expect(couponModel.create).toHaveBeenCalled();
    });

    it('throws on duplicate code', async () => {
      couponModel.exists.mockResolvedValue({ _id: couponId });
      await expect(service.adminCreate(dto as any))
        .rejects.toThrow(ConflictException);
    });

    it('throws when startDate >= endDate', async () => {
      couponModel.exists.mockResolvedValue(null);
      await expect(
        service.adminCreate({
          ...dto, startDate: future.toISOString(), endDate: past.toISOString(),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when percentage > 100', async () => {
      couponModel.exists.mockResolvedValue(null);
      await expect(
        service.adminCreate({
          ...dto, type: DiscountType.PERCENTAGE, value: 110,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── adminDeactivate ───────────────────────────────────────────
  describe('adminDeactivate', () => {
    it('sets isActive to false', async () => {
      couponModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCoupon({ isActive: false })),
        }),
      });

      const res = await service.adminDeactivate(couponId.toString());
      expect(res.isActive).toBe(false);
    });

    it('throws when coupon not found', async () => {
      couponModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(service.adminDeactivate(couponId.toString()))
        .rejects.toThrow(NotFoundException);
    });
  });
});
