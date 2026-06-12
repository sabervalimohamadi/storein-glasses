import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductService } from './product.service';
import { Product, ProductStatus } from './entities/product.schema';
import { Category } from '../category/entities/category.schema';
import { Color } from '../color/entities/color.schema';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
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

const mockProduct = (overrides = {}) => ({
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
    it('applies percentage discount to all variants', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 10_000_000, comparePrice: 0 })],
      });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      const result = await service.bulkDiscount({
        productIds: [prodId], discountPct: 20,
      });

      expect(result.updated).toBe(1);
      expect(prod.variants[0].comparePrice).toBe(10_000_000);
      expect(prod.variants[0].price).toBe(8_000_000);
    });

    it('restores original price when discountPct is 0', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 8_000_000, comparePrice: 10_000_000 })],
      });
      model.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([prod]) });

      await service.bulkDiscount({ productIds: [prodId], discountPct: 0 });

      expect(prod.variants[0].price).toBe(10_000_000);
      expect(prod.variants[0].comparePrice).toBe(0);
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
});
