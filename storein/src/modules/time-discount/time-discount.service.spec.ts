import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TimeDiscountService } from './time-discount.service';
import { TimeDiscount } from './schemas/time-discount.schema';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockLogger = {
  setContext: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const now = new Date();
const past = new Date(now.getTime() - 86400000);
const future = new Date(now.getTime() + 86400000);

function makeDiscount(overrides: Partial<any> = {}): any {
  return {
    _id: '64a000000000000000000001',
    title: 'جشنواره',
    discountType: 'percentage',
    value: 20,
    maxDiscountAmount: null,
    startDate: past,
    endDate: future,
    targetType: 'all',
    targetIds: [],
    isActive: true,
    usageCount: 0,
    maxUsageCount: null,
    ...overrides,
  };
}

describe('TimeDiscountService', () => {
  let service: TimeDiscountService;
  let modelMock: any;

  beforeEach(async () => {
    modelMock = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeDiscountService,
        { provide: getModelToken(TimeDiscount.name), useValue: modelMock },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TimeDiscountService>(TimeDiscountService);
    jest.clearAllMocks();
  });

  // ── calculateDiscountedPrice ──────────────────────────────────

  describe('calculateDiscountedPrice', () => {
    beforeEach(() => {
      mockRedis.get.mockResolvedValue(null);
      const chainMock = { select: jest.fn().mockReturnThis(), lean: jest.fn() };
      modelMock.find.mockReturnValue(chainMock);
      chainMock.lean.mockResolvedValue([]);
    });

    it('returns original price when no discounts are active', async () => {
      const result = await service.calculateDiscountedPrice(100000, 'prod1', 'cat1');
      expect(result.finalPrice).toBe(100000);
      expect(result.discountAmount).toBe(0);
    });

    it('applies percentage discount correctly', async () => {
      const chainMock = { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([makeDiscount({ value: 20, discountType: 'percentage' })]) };
      modelMock.find.mockReturnValue(chainMock);

      const result = await service.calculateDiscountedPrice(500000, 'prod1', 'cat1');
      expect(result.discountAmount).toBe(100000);
      expect(result.finalPrice).toBe(400000);
      expect(result.discountPercentage).toBe(20);
    });

    it('respects maxDiscountAmount cap for percentage discounts', async () => {
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([makeDiscount({ value: 50, discountType: 'percentage', maxDiscountAmount: 50000 })]),
      };
      modelMock.find.mockReturnValue(chainMock);

      const result = await service.calculateDiscountedPrice(500000, 'prod1', 'cat1');
      expect(result.discountAmount).toBe(50000);
      expect(result.finalPrice).toBe(450000);
    });

    it('applies fixed discount correctly', async () => {
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([makeDiscount({ value: 30000, discountType: 'fixed' })]),
      };
      modelMock.find.mockReturnValue(chainMock);

      const result = await service.calculateDiscountedPrice(200000, 'prod1', 'cat1');
      expect(result.discountAmount).toBe(30000);
      expect(result.finalPrice).toBe(170000);
    });

    it('selects the discount with the highest amount when multiple are active', async () => {
      const small = makeDiscount({ _id: 'id1', value: 10, discountType: 'percentage' });
      const big = makeDiscount({ _id: 'id2', value: 40, discountType: 'percentage' });
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([small, big]),
      };
      modelMock.find.mockReturnValue(chainMock);

      const result = await service.calculateDiscountedPrice(100000, 'prod1', 'cat1');
      expect(result.activeDiscountId).toBe('id2');
      expect(result.discountAmount).toBe(40000);
    });

    it('does not apply expired discounts', async () => {
      const expired = makeDiscount({ endDate: past, startDate: new Date(past.getTime() - 86400000) });
      const chainMock = { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) };
      modelMock.find.mockReturnValue(chainMock);

      const result = await service.calculateDiscountedPrice(100000, 'prod1', 'cat1');
      expect(result.discountAmount).toBe(0);
    });

    it('applies wholesalePrice as base when provided', async () => {
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([makeDiscount({ value: 10, discountType: 'percentage' })]),
      };
      modelMock.find.mockReturnValue(chainMock);

      const result = await service.calculateDiscountedPrice(200000, 'prod1', 'cat1', 150000);
      expect(result.discountAmount).toBe(15000);
      expect(result.finalPrice).toBe(135000);
    });
  });

  // ── create ────────────────────────────────────────────────────

  describe('create', () => {
    it('throws if endDate is not after startDate', async () => {
      await expect(
        service.create({
          title: 'test',
          discountType: 'percentage',
          value: 10,
          startDate: future.toISOString(),
          endDate: past.toISOString(),
          targetType: 'all',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
