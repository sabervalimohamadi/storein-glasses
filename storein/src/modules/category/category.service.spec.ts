import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CategoryService } from './category.service';
import { Category } from './entities/category.schema';
import { Product } from '../product/entities/product.schema';

const mockId = new Types.ObjectId().toString();
const mockCat = (overrides: Record<string, any> = {}) => ({
  _id: new Types.ObjectId(mockId),
  name: 'موبایل',
  slug: 'mobile',
  parent: null,
  ancestors: [],
  depth: 0,
  isActive: true,
  sortOrder: 0,
  ...overrides,
});

describe('CategoryService', () => {
  let service: CategoryService;
  let model: any;
  let productModel: any;

  const lean        = (val: any) => ({ lean: jest.fn().mockResolvedValue(val) });
  const selectLean  = (val: any) => ({ select: jest.fn().mockReturnValue(lean(val)) });
  const sortLean    = (val: any) => ({ sort: jest.fn().mockReturnValue(lean(val)) });
  const selectSort  = (val: any) => ({ select: jest.fn().mockReturnValue(sortLean(val)) });

  beforeEach(async () => {
    model = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      exists: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
    };

    productModel = {
      aggregate: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: getModelToken(Category.name), useValue: model },
        { provide: getModelToken(Product.name),  useValue: productModel },
      ],
    }).compile();

    service = module.get(CategoryService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates root category with auto slug', async () => {
      model.findOne.mockReturnValue(lean(null));
      model.create.mockResolvedValue({ ...mockCat(), toObject: () => mockCat() });

      const res = await service.create({ name: 'موبایل' });
      expect(res.slug).toBe('mobile');
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ depth: 0, ancestors: [], parent: null }),
      );
    });

    it('creates child category with correct ancestors and depth', async () => {
      const parentDoc = mockCat({ _id: new Types.ObjectId(mockId) });
      model.findById.mockReturnValue(lean(parentDoc));
      model.findOne.mockReturnValue(lean(null));
      model.create.mockResolvedValue({
        ...mockCat({ depth: 1 }),
        toObject: () => mockCat({ depth: 1 }),
      });

      const res = await service.create({ name: 'گوشی', parent: mockId });
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ depth: 1 }),
      );
    });

    it('throws if parent not found', async () => {
      model.findById.mockReturnValue(lean(null));
      await expect(service.create({ name: 'تست', parent: mockId }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws on circular parent (self)', async () => {
      model.findById.mockResolvedValue(mockCat());
      await expect(service.update(mockId, { parent: mockId }))
        .rejects.toThrow(BadRequestException);
    });

    it('updates name and regenerates slug', async () => {
      model.findById.mockResolvedValue(mockCat());
      model.findOne.mockReturnValue(lean(null));
      model.findByIdAndUpdate.mockReturnValue(selectLean(mockCat({ name: 'تبلت', slug: 'tablet' })));

      const res = await service.update(mockId, { name: 'تبلت' });
      expect(model.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws if category has children', async () => {
      model.exists.mockResolvedValue(true);
      await expect(service.remove(mockId)).rejects.toThrow(BadRequestException);
    });

    it('throws if not found', async () => {
      model.exists.mockResolvedValue(false);
      model.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.remove(mockId)).rejects.toThrow(NotFoundException);
    });

    it('deletes category successfully', async () => {
      model.exists.mockResolvedValue(false);
      model.findByIdAndDelete.mockResolvedValue(mockCat());
      await expect(service.remove(mockId)).resolves.toBeUndefined();
    });
  });

  describe('getBySlug', () => {
    it('throws if not found', async () => {
      model.findOne.mockReturnValue(selectLean(null));
      await expect(service.getBySlug('not-exist')).rejects.toThrow(NotFoundException);
    });

    it('returns category with children', async () => {
      model.findOne.mockReturnValue(selectLean(mockCat()));
      model.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue(lean([])),
        }),
      });
      const res = await service.getBySlug('mobile');
      expect(res.category.slug).toBe('mobile');
    });
  });

  describe('getRootsWithStock', () => {
    it('returns only root categories (depth=0)', async () => {
      const rootId  = new Types.ObjectId();
      const childId = new Types.ObjectId();

      const root  = mockCat({ _id: rootId,  depth: 0, ancestors: [],      parent: null    });
      const child = mockCat({ _id: childId, depth: 1, ancestors: [rootId], parent: rootId });

      model.find.mockReturnValue(selectSort([root, child]));
      productModel.aggregate.mockResolvedValue([]);

      const result = await service.getRootsWithStock();

      expect(result).toHaveLength(1);
      expect(result[0]._id.toString()).toBe(rootId.toString());
    });

    it('rolls up child product stock to the root', async () => {
      const rootId  = new Types.ObjectId();
      const childId = new Types.ObjectId();

      const root  = mockCat({ _id: rootId,  depth: 0, ancestors: [],       parent: null    });
      const child = mockCat({ _id: childId, depth: 1, ancestors: [rootId],  parent: rootId });

      model.find.mockReturnValue(selectSort([root, child]));
      productModel.aggregate.mockResolvedValue([
        { _id: childId.toString(), totalStock: 80, productsCount: 4 },
      ]);

      const result = await service.getRootsWithStock();

      expect(result[0].totalStock).toBe(80);
      expect(result[0].productsCount).toBe(4);
    });

    it('accumulates stock from multiple children', async () => {
      const rootId   = new Types.ObjectId();
      const childId1 = new Types.ObjectId();
      const childId2 = new Types.ObjectId();

      model.find.mockReturnValue(selectSort([
        mockCat({ _id: rootId,   depth: 0, ancestors: [],       parent: null    }),
        mockCat({ _id: childId1, depth: 1, ancestors: [rootId], parent: rootId }),
        mockCat({ _id: childId2, depth: 1, ancestors: [rootId], parent: rootId }),
      ]));
      productModel.aggregate.mockResolvedValue([
        { _id: childId1.toString(), totalStock: 30, productsCount: 2 },
        { _id: childId2.toString(), totalStock: 50, productsCount: 3 },
      ]);

      const result = await service.getRootsWithStock();

      expect(result[0].totalStock).toBe(80);
      expect(result[0].productsCount).toBe(5);
    });

    it('returns empty array when no active categories exist', async () => {
      model.find.mockReturnValue(selectSort([]));
      productModel.aggregate.mockResolvedValue([]);

      const result = await service.getRootsWithStock();
      expect(result).toEqual([]);
    });

    it('ignores product stats for unknown category IDs', async () => {
      const rootId = new Types.ObjectId();
      model.find.mockReturnValue(selectSort([
        mockCat({ _id: rootId, depth: 0, ancestors: [], parent: null }),
      ]));
      productModel.aggregate.mockResolvedValue([
        { _id: new Types.ObjectId().toString(), totalStock: 999, productsCount: 99 },
      ]);

      const result = await service.getRootsWithStock();
      expect(result[0].totalStock).toBe(0);
      expect(result[0].productsCount).toBe(0);
    });
  });
});
