import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductService } from './product.service';
import { Product, ProductStatus } from './entities/product.schema';

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getModelToken(Product.name), useValue: model },
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
  });
});
