import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductService } from './product.service';
import { Product, ProductStatus } from './entities/product.schema';
import { Category } from '../category/entities/category.schema';
import { Color } from '../color/entities/color.schema';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { DiscountsService } from '../../discounts/discounts.service';

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
};

const mockDiscountsService = {
  create:                   jest.fn(),
  calculateDiscountedPrice: jest.fn().mockResolvedValue({ finalPrice: 0, discountAmount: 0, discountPercentage: 0, activeDiscount: null }),
  getActiveDiscounts:       jest.fn().mockResolvedValue([]),
  invalidateCache:          jest.fn(),
};

const catId  = new Types.ObjectId().toString();
const prodId = new Types.ObjectId().toString();
const varId  = new Types.ObjectId();

const mockVariant = (overrides = {}) => ({
  _id: varId,
  sku: 'SKU-001',
  price: 10_000_000,
  comparePrice: null,
  stock: 5,
  isActive: true,
  attributes: [],
  ...overrides,
});

const mockProduct = (overrides: Record<string, any> = {}) => ({
  _id: new Types.ObjectId(prodId),
  name: 'سامسونگ گلکسی A55',
  slug: 'samsung-galaxy-a55',
  category: new Types.ObjectId(catId),
  status: ProductStatus.ACTIVE,
  variants: [mockVariant()],
  minPrice: 10_000_000,
  maxPrice: 10_000_000,
  totalStock: 5,
  images: [],
  specs: [],
  tags: [],
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnThis(),
  markModified: jest.fn(),
  ...overrides,
});

describe('ProductService', () => {
  let service: ProductService;
  let model: any;

  const lean = (v: any) => ({ lean: jest.fn().mockResolvedValue(v) });
  const execChain = (v: any) => ({
    select: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue(lean(v)),
        }),
      }),
      populate: jest.fn().mockReturnValue(lean(v)),
    }),
  });

  beforeEach(async () => {
    model = {
      find:              jest.fn().mockReturnValue(execChain([])),
      findOne:           jest.fn().mockReturnValue(execChain(null)),
      findById:          jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments:    jest.fn().mockResolvedValue(0),
      create:            jest.fn(),
    };

    const catModel   = { findOne: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) }) };
    const colorModel = { findOne: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getModelToken(Product.name),  useValue: model },
        { provide: getModelToken(Category.name), useValue: catModel },
        { provide: getModelToken(Color.name),    useValue: colorModel },
        { provide: AppLoggerService,             useValue: mockLogger },
        { provide: DiscountsService,              useValue: mockDiscountsService },
      ],
    }).compile();

    service = module.get(ProductService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates product and calculates denormalized fields', async () => {
      model.findOne.mockReturnValue(lean(null));
      model.create.mockResolvedValue({
        ...mockProduct(),
        toObject: () => mockProduct(),
      });

      const res = await service.create({
        name: 'سامسونگ گلکسی A55',
        category: catId,
        variants: [{ sku: 'SKU-001', price: 10_000_000, stock: 5 }],
      });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 10_000_000, totalStock: 5 }),
      );
    });
  });

  describe('addVariant', () => {
    it('adds variant and updates denormalized fields', async () => {
      const prod = mockProduct({ variants: [] });
      model.findById.mockResolvedValue(prod);

      await service.addVariant(prodId, {
        sku: 'SKU-002', price: 12_000_000, stock: 3,
      });

      expect(prod.variants.length).toBe(1);
      expect(prod.save).toHaveBeenCalled();
    });

    it('throws on duplicate SKU', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await expect(
        service.addVariant(prodId, { sku: 'SKU-001', price: 1000, stock: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('adjustStock', () => {
    it('increases stock', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await service.adjustStock(prodId, varId.toString(), 10);
      expect(prod.variants[0].stock).toBe(15);
    });

    it('throws when stock goes negative', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await expect(
        service.adjustStock(prodId, varId.toString(), -100),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeVariant', () => {
    it('removes variant and recalculates denormalized', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await service.removeVariant(prodId, varId.toString());
      expect(prod.variants.length).toBe(0);
      expect(prod.totalStock).toBe(0);
    });
  });

  describe('remove', () => {
    it('throws if product not found', async () => {
      model.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.remove(prodId)).rejects.toThrow(NotFoundException);
    });

    it('removes product successfully', async () => {
      model.findByIdAndDelete.mockResolvedValue(mockProduct());
      await expect(service.remove(prodId)).resolves.toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates product and returns updated doc', async () => {
      const existing = mockProduct();
      const updated  = mockProduct({ name: 'سامسونگ A55 جدید' });
      model.findById.mockResolvedValue(existing);
      model.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) }),
      });

      const result = await service.update(prodId, { name: 'سامسونگ A55 جدید' });
      expect(result.name).toBe('سامسونگ A55 جدید');
    });

    it('throws NotFoundException when product not found', async () => {
      model.findById.mockResolvedValue(null);
      await expect(service.update(prodId, { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateVariant', () => {
    it('updates variant fields', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await service.updateVariant(prodId, varId.toString(), { price: 15_000_000 });

      expect(prod.variants[0].price).toBe(15_000_000);
      expect(prod.save).toHaveBeenCalled();
    });

    it('throws on duplicate SKU when updating', async () => {
      const varId2 = new Types.ObjectId();
      const prod = mockProduct({
        variants: [
          mockVariant({ _id: varId,  sku: 'SKU-001' }),
          mockVariant({ _id: varId2, sku: 'SKU-002' }),
        ],
      });
      model.findById.mockResolvedValue(prod);

      await expect(
        service.updateVariant(prodId, varId.toString(), { sku: 'SKU-002' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkDiscount', () => {
    it('applies discount from original price and saves with markModified', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 10_000_000, comparePrice: 0 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      const result = await service.bulkDiscount({ productIds: [prodId], discountPct: 20 });

      expect(result.updated).toBe(1);
      expect(prod.variants[0].comparePrice).toBe(10_000_000);
      expect(prod.variants[0].price).toBe(8_000_000);
      expect(prod.markModified).toHaveBeenCalledWith('variants');
      expect(prod.save).toHaveBeenCalled();
    });

    it('always discounts from the original comparePrice, not the already-discounted price', async () => {
      // Product had 25% discount before (comparePrice=10M, price=7.5M)
      // Applying 19% should give 19% off 10M = 8.1M, NOT 19% off 7.5M
      const prod = mockProduct({
        variants: [mockVariant({ price: 7_500_000, comparePrice: 10_000_000 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      await service.bulkDiscount({ productIds: [prodId], discountPct: 19 });

      expect(prod.variants[0].comparePrice).toBe(10_000_000);
      expect(prod.variants[0].price).toBe(8_100_000); // 10M * 0.81
    });

    it('applies same discount across multiple variants correctly', async () => {
      const prod = mockProduct({
        variants: [
          mockVariant({ _id: new Types.ObjectId(), sku: 'A', price: 5_000_000, comparePrice: 0 }),
          mockVariant({ _id: new Types.ObjectId(), sku: 'B', price: 8_000_000, comparePrice: 0 }),
        ],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      await service.bulkDiscount({ productIds: [prodId], discountPct: 10 });

      expect(prod.variants[0].price).toBe(4_500_000);
      expect(prod.variants[0].comparePrice).toBe(5_000_000);
      expect(prod.variants[1].price).toBe(7_200_000);
      expect(prod.variants[1].comparePrice).toBe(8_000_000);
    });

    it('restores original price and clears comparePrice when discountPct is 0', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 8_000_000, comparePrice: 10_000_000 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      await service.bulkDiscount({ productIds: [prodId], discountPct: 0 });

      expect(prod.variants[0].price).toBe(10_000_000);
      expect(prod.variants[0].comparePrice).toBe(0);
      expect(prod.markModified).toHaveBeenCalledWith('variants');
    });

    it('does not change variant price when discountPct is 0 and no comparePrice exists', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 5_000_000, comparePrice: 0 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      await service.bulkDiscount({ productIds: [prodId], discountPct: 0 });

      expect(prod.variants[0].price).toBe(5_000_000);
      expect(prod.variants[0].comparePrice).toBe(0);
    });

    it('updates multiple products and returns correct updated count', async () => {
      const prod1 = mockProduct({ variants: [mockVariant({ price: 1_000_000, comparePrice: 0 })], markModified: jest.fn() });
      const prod2 = mockProduct({ _id: new Types.ObjectId(), variants: [mockVariant({ price: 2_000_000, comparePrice: 0 })], save: jest.fn().mockResolvedValue(true), markModified: jest.fn() });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod1, prod2]) });

      const result = await service.bulkDiscount({ productIds: [prodId, prod2._id.toString()], discountPct: 30 });

      expect(result.updated).toBe(2);
      expect(prod1.save).toHaveBeenCalled();
      expect(prod2.save).toHaveBeenCalled();
    });

    it('clamps discountPct to 90 maximum', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 10_000_000, comparePrice: 0 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      await service.bulkDiscount({ productIds: [prodId], discountPct: 99 });

      // 90% of 10M = 1M
      expect(prod.variants[0].price).toBe(1_000_000);
      expect(prod.variants[0].comparePrice).toBe(10_000_000);
    });

    it('logs warn when removing discount (pct=0) and logs done after completion', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 8_000_000, comparePrice: 10_000_000 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      await service.bulkDiscount({ productIds: [prodId], discountPct: 0 });

      expect(mockLogger.warn).toHaveBeenCalledWith('BulkDiscount: removing discount', expect.any(Object));
      expect(mockLogger.log).toHaveBeenCalledWith('BulkDiscount: done', expect.objectContaining({ updated: 1, pct: 0 }));
    });
  });

  describe('bulkDiscount — timed mode', () => {
    const startDate = '2026-07-01T00:00:00.000Z';
    const endDate   = '2026-07-15T23:59:59.000Z';

    beforeEach(() => jest.clearAllMocks());

    it('delegates to DiscountsService when startDate+endDate provided', async () => {
      mockDiscountsService.create.mockResolvedValue({ _id: new Types.ObjectId() });

      const result = await service.bulkDiscount({
        productIds: [prodId],
        discountPct: 25,
        startDate,
        endDate,
      });

      expect(mockDiscountsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kind:         'time_limited',
          discountType: 'percentage',
          value:        25,
          targetType:   'products',
          targetIds:    [prodId],
          startDate,
          endDate,
        }),
      );
      expect(result).toEqual({ updated: 1, mode: 'timed' });
    });

    it('does not query or modify products in timed mode', async () => {
      mockDiscountsService.create.mockResolvedValue({ _id: new Types.ObjectId() });

      await service.bulkDiscount({ productIds: [prodId], discountPct: 20, startDate, endDate });

      expect(model.find).not.toHaveBeenCalled();
    });

    it('uses custom title when provided', async () => {
      mockDiscountsService.create.mockResolvedValue({ _id: new Types.ObjectId() });

      await service.bulkDiscount({
        productIds: [prodId],
        discountPct: 30,
        startDate,
        endDate,
        title: 'فروش ویژه تابستان',
      });

      expect(mockDiscountsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'فروش ویژه تابستان' }),
      );
    });

    it('auto-generates title from pct when title is not provided', async () => {
      mockDiscountsService.create.mockResolvedValue({ _id: new Types.ObjectId() });

      await service.bulkDiscount({ productIds: [prodId], discountPct: 15, startDate, endDate });

      expect(mockDiscountsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'تخفیف گروهی 15٪' }),
      );
    });

    it('throws BadRequestException when endDate is before startDate', async () => {
      await expect(
        service.bulkDiscount({
          productIds:  [prodId],
          discountPct: 10,
          startDate:   '2026-07-15T00:00:00.000Z',
          endDate:     '2026-07-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockDiscountsService.create).not.toHaveBeenCalled();
    });

    it('falls back to permanent mode when only startDate is given (no endDate)', async () => {
      const prod = mockProduct({ variants: [mockVariant()], markModified: jest.fn() });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      const result = await service.bulkDiscount({
        productIds:  [prodId],
        discountPct: 10,
        startDate,
      });

      expect(mockDiscountsService.create).not.toHaveBeenCalled();
      expect(result.mode).toBe('permanent');
    });
  });

  describe('adjustStock — low stock warn', () => {
    it('emits warn log when stock drops to ≤5', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ stock: 7 })],
      });
      model.findById.mockResolvedValue(prod);

      await service.adjustStock(prodId, varId.toString(), -4);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Low stock',
        expect.objectContaining({ stock: 3 }),
      );
    });
  });

  describe('findAll — sort', () => {
    it('sorts by viewCount desc when sort=mostViewed', async () => {
      await service.findAll({ sort: 'mostViewed' });
      const sortCall = model.find().select().sort.mock.calls[0][0];
      expect(sortCall).toEqual({ viewCount: -1, createdAt: -1 });
    });

    it('defaults to newest sort when no sort param', async () => {
      await service.findAll({});
      const sortCall = model.find().select().sort.mock.calls[0][0];
      expect(sortCall).toEqual({ createdAt: -1 });
    });

    it('sorts by soldCount when sort=bestseller', async () => {
      await service.findAll({ sort: 'bestseller' });
      const sortCall = model.find().select().sort.mock.calls[0][0];
      expect(sortCall).toEqual({ soldCount: -1 });
    });
  });
});
