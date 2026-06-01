import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CategoryService } from './category.service';
import { Category } from './entities/category.schema';

const mockId = new Types.ObjectId().toString();
const mockCat = (overrides = {}) => ({
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

  const lean = (val: any) => ({ lean: jest.fn().mockResolvedValue(val) });
  const selectLean = (val: any) => ({ select: jest.fn().mockReturnValue(lean(val)) });

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: getModelToken(Category.name), useValue: model },
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
});
