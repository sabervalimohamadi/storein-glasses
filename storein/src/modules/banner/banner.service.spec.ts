import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BannerService } from './banner.service';
import { Banner } from './entities/banner.schema';
import { AppLoggerService } from '../../common/logger/app-logger.service';

// ── Fixtures ───────────────────────────────────────────────────────────────
const id1 = new Types.ObjectId().toHexString();
const id2 = new Types.ObjectId().toHexString();

const makeBanner = (overrides: Record<string, unknown> = {}) => ({
  _id:       new Types.ObjectId(),
  title:     'بنر آفتابی',
  eyebrow:   'تابستان ۱۴۰۴',
  subtitle:  '',
  cta:       'مشاهده محصولات',
  ctaLink:   '/',
  bgFrom:    '#0F3D73',
  bgTo:      '#1B4F8A',
  accent:    '#FFD700',
  imageUrl:  '',
  glasses:   'sun',
  type:      'hero',
  isActive:  true,
  sortOrder: 0,
  ...overrides,
});

const EXPECTED_SORT = { sortOrder: 1, createdAt: 1 };

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log:   jest.fn(),
  warn:  jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

/** Simulates a chainable Mongoose query: .sort().select().lean() */
const chainLean = (value: unknown) => {
  const q = {
    sort:   jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean:   jest.fn().mockResolvedValue(value),
  };
  return q;
};

// ── Suite ──────────────────────────────────────────────────────────────────
describe('BannerService', () => {
  let service: BannerService;
  let model: any;

  beforeEach(async () => {
    const heroDoc = {
      ...makeBanner({ type: 'hero' }),
      save:     jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnThis(),
    };
    model = {
      find:              jest.fn(),
      findById:          jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments:    jest.fn().mockResolvedValue(0),
      bulkWrite:         jest.fn().mockResolvedValue({}),
      create:            jest.fn().mockResolvedValue(heroDoc),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerService,
        { provide: getModelToken(Banner.name), useValue: model },
        { provide: AppLoggerService,           useValue: mockLogger },
      ],
    }).compile();

    service = module.get(BannerService);
    jest.clearAllMocks();
    mockLogger.setContext.mockReturnThis();
  });

  // ── findActive ────────────────────────────────────────────────────────
  describe('findActive', () => {
    it('queries { isActive: true, type: "hero" }', async () => {
      model.find.mockReturnValue(chainLean([]))
      await service.findActive()
      expect(model.find).toHaveBeenCalledWith({ isActive: true, type: 'hero' })
    })

    it('applies sort { sortOrder: 1, createdAt: 1 }', async () => {
      const q = chainLean([])
      model.find.mockReturnValue(q)
      await service.findActive()
      expect(q.sort).toHaveBeenCalledWith(EXPECTED_SORT)
    })

    it('strips __v from projection', async () => {
      const q = chainLean([])
      model.find.mockReturnValue(q)
      await service.findActive()
      expect(q.select).toHaveBeenCalledWith('-__v')
    })

    it('returns the full result array', async () => {
      const heroes = [makeBanner(), makeBanner({ title: 'بنر ۲' })]
      model.find.mockReturnValue(chainLean(heroes))
      const result = await service.findActive()
      expect(result).toHaveLength(2)
    })

    it('does not log for read operations', async () => {
      model.find.mockReturnValue(chainLean([]))
      await service.findActive()
      expect(mockLogger.log).not.toHaveBeenCalled()
    })
  })

  // ── findActivePromo ───────────────────────────────────────────────────
  describe('findActivePromo', () => {
    it('queries { isActive: true, type: "promo" }', async () => {
      model.find.mockReturnValue(chainLean([]))
      await service.findActivePromo()
      expect(model.find).toHaveBeenCalledWith({ isActive: true, type: 'promo' })
    })

    it('applies same sort as hero — sortOrder asc, then createdAt', async () => {
      const q = chainLean([])
      model.find.mockReturnValue(q)
      await service.findActivePromo()
      expect(q.sort).toHaveBeenCalledWith(EXPECTED_SORT)
    })

    it('strips __v from projection', async () => {
      const q = chainLean([])
      model.find.mockReturnValue(q)
      await service.findActivePromo()
      expect(q.select).toHaveBeenCalledWith('-__v')
    })

    it('result contains only promo-type items', async () => {
      const promos = [makeBanner({ type: 'promo' }), makeBanner({ type: 'promo', title: 'بنر ۲' })]
      model.find.mockReturnValue(chainLean(promos))
      const result = await service.findActivePromo()
      expect(result.every(b => b.type === 'promo')).toBe(true)
    })

    it('returns empty array when no active promo banners exist', async () => {
      model.find.mockReturnValue(chainLean([]))
      const result = await service.findActivePromo()
      expect(result).toHaveLength(0)
    })

    it('does not log for read operations', async () => {
      model.find.mockReturnValue(chainLean([]))
      await service.findActivePromo()
      expect(mockLogger.log).not.toHaveBeenCalled()
    })
  })

  // ── findAll ───────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('queries with no filter — returns all types and states', async () => {
      model.find.mockReturnValue(chainLean([]))
      await service.findAll()
      expect(model.find).toHaveBeenCalledWith()
    })

    it('applies sort', async () => {
      const q = chainLean([])
      model.find.mockReturnValue(q)
      await service.findAll()
      expect(q.sort).toHaveBeenCalledWith(EXPECTED_SORT)
    })

    it('strips __v from projection', async () => {
      const q = chainLean([])
      model.find.mockReturnValue(q)
      await service.findAll()
      expect(q.select).toHaveBeenCalledWith('-__v')
    })
  })

  // ── create ────────────────────────────────────────────────────────────
  describe('create', () => {
    it('defaults type to "hero" when not provided', async () => {
      await service.create({ title: 'بنر' } as any)
      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'hero' }))
    })

    it('uses provided type "promo"', async () => {
      model.create.mockResolvedValue(makeBanner({ type: 'promo' }))
      await service.create({ title: 'بنر ویژه', type: 'promo' } as any)
      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'promo' }))
    })

    it('counts existing hero banners when creating a hero banner', async () => {
      model.countDocuments.mockResolvedValue(3)
      await service.create({ title: 'بنر', type: 'hero' } as any)
      expect(model.countDocuments).toHaveBeenCalledWith({ type: 'hero' })
      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 3 }))
    })

    it('counts existing promo banners independently of hero count', async () => {
      model.countDocuments.mockResolvedValue(1)
      await service.create({ title: 'بنر ویژه', type: 'promo' } as any)
      expect(model.countDocuments).toHaveBeenCalledWith({ type: 'promo' })
      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 1 }))
    })

    it('respects explicit sortOrder from dto', async () => {
      await service.create({ title: 'بنر', sortOrder: 99 } as any)
      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 99 }))
    })

    it('logs bannerId, title, type and sortOrder', async () => {
      model.countDocuments.mockResolvedValue(2)
      await service.create({ title: 'بنر' } as any)
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Banner created',
        expect.objectContaining({
          title:     expect.any(String),
          type:      'hero',
          sortOrder: expect.any(Number),
        }),
      )
    })
  })

  // ── update ────────────────────────────────────────────────────────────
  describe('update', () => {
    it('passes dto through findByIdAndUpdate', async () => {
      const updated = makeBanner({ title: 'ویرایش شده', type: 'hero' })
      model.findByIdAndUpdate.mockReturnValue(chainLean(updated))
      const result = await service.update(id1, { title: 'ویرایش شده' } as any)
      expect(result.title).toBe('ویرایش شده')
    })

    it('uses new: true and runValidators: true', async () => {
      model.findByIdAndUpdate.mockReturnValue(chainLean(makeBanner()))
      await service.update(id1, { title: 'تست' } as any)
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        id1, { title: 'تست' },
        { new: true, runValidators: true },
      )
    })

    it('strips __v from projection', async () => {
      const q = chainLean(makeBanner())
      model.findByIdAndUpdate.mockReturnValue(q)
      await service.update(id1, {} as any)
      expect(q.select).toHaveBeenCalledWith('-__v')
    })

    it('logs bannerId, type and changed field names', async () => {
      model.findByIdAndUpdate.mockReturnValue(chainLean(makeBanner({ type: 'promo' })))
      await service.update(id1, { title: 'تست', bgFrom: '#111' } as any)
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Banner updated',
        expect.objectContaining({
          bannerId: id1,
          type:     'promo',
          fields:   expect.arrayContaining(['title', 'bgFrom']),
        }),
      )
    })

    it('throws NotFoundException when banner does not exist', async () => {
      model.findByIdAndUpdate.mockReturnValue(chainLean(null))
      await expect(service.update(id1, {} as any)).rejects.toThrow(NotFoundException)
    })
  })

  // ── remove ────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('calls findByIdAndDelete with the correct id', async () => {
      model.findByIdAndDelete.mockResolvedValue(makeBanner())
      await service.remove(id1)
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(id1)
    })

    it('logs bannerId, title and type on delete', async () => {
      model.findByIdAndDelete.mockResolvedValue(makeBanner({ type: 'promo', title: 'بنر ویژه' }))
      await service.remove(id1)
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Banner deleted',
        expect.objectContaining({ bannerId: id1, title: 'بنر ویژه', type: 'promo' }),
      )
    })

    it('throws NotFoundException when banner not found', async () => {
      model.findByIdAndDelete.mockResolvedValue(null)
      await expect(service.remove(id1)).rejects.toThrow(NotFoundException)
    })
  })

  // ── reorder ───────────────────────────────────────────────────────────
  describe('reorder', () => {
    it('builds bulkWrite ops with sortOrder = array index', async () => {
      await service.reorder({ ids: [id1, id2] })
      expect(model.bulkWrite).toHaveBeenCalledWith([
        { updateOne: { filter: { _id: id1 }, update: { $set: { sortOrder: 0 } } } },
        { updateOne: { filter: { _id: id2 }, update: { $set: { sortOrder: 1 } } } },
      ])
    })

    it('works correctly for a single-element list', async () => {
      await service.reorder({ ids: [id1] })
      expect(model.bulkWrite).toHaveBeenCalledWith([
        { updateOne: { filter: { _id: id1 }, update: { $set: { sortOrder: 0 } } } },
      ])
    })

    it('logs count after reorder', async () => {
      await service.reorder({ ids: [id1, id2] })
      expect(mockLogger.log).toHaveBeenCalledWith('Banners reordered', { count: 2 })
    })
  })

  // ── toggleActive ──────────────────────────────────────────────────────
  describe('toggleActive', () => {
    it('flips true → false and logs isActive + type for promo', async () => {
      const doc = {
        ...makeBanner({ type: 'promo', isActive: true }),
        save:     jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnThis(),
      }
      model.findById.mockResolvedValue(doc)
      await service.toggleActive(id1)
      expect(doc.isActive).toBe(false)
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Banner toggled',
        expect.objectContaining({ bannerId: id1, isActive: false, type: 'promo' }),
      )
    })

    it('flips false → true for hero banner', async () => {
      const doc = {
        ...makeBanner({ type: 'hero', isActive: false }),
        save:     jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnThis(),
      }
      model.findById.mockResolvedValue(doc)
      await service.toggleActive(id1)
      expect(doc.isActive).toBe(true)
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Banner toggled',
        expect.objectContaining({ isActive: true, type: 'hero' }),
      )
    })

    it('calls save on the document', async () => {
      const doc = {
        ...makeBanner({ isActive: true }),
        save:     jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnThis(),
      }
      model.findById.mockResolvedValue(doc)
      await service.toggleActive(id1)
      expect(doc.save).toHaveBeenCalledTimes(1)
    })

    it('throws NotFoundException for unknown id', async () => {
      model.findById.mockResolvedValue(null)
      await expect(service.toggleActive(id1)).rejects.toThrow(NotFoundException)
    })
  })
})
