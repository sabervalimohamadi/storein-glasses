import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { Product } from '../product/entities/product.schema';
import { Category } from '../category/entities/category.schema';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
};

const userId = 'user_123';

describe('SearchService', () => {
  let service: SearchService;
  let redis: jest.Mocked<any>;
  let productModel: any;
  let categoryModel: any;

  const leanChain = (val: any) => ({
    select: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(val),
            }),
          }),
        }),
      }),
      limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(val) }),
      lean: jest.fn().mockResolvedValue(val),
    }),
  });

  beforeEach(async () => {
    redis = {
      get:    jest.fn().mockResolvedValue(null),
      setex:  jest.fn(),
      lrange: jest.fn().mockResolvedValue([]),
      lpush:  jest.fn(),
      lrem:   jest.fn(),
      ltrim:  jest.fn(),
      expire: jest.fn(),
      del:    jest.fn(),
    };

    productModel = {
      find:          jest.fn().mockReturnValue(leanChain([])),
      countDocuments:jest.fn().mockResolvedValue(0),
      aggregate:     jest.fn().mockResolvedValue([{ priceRange: [], attributeValues: [] }]),
    };

    categoryModel = {
      find: jest.fn().mockReturnValue(leanChain([])),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getModelToken(Product.name),  useValue: productModel },
        { provide: getModelToken(Category.name), useValue: categoryModel },
        { provide: REDIS_CLIENT,                 useValue: redis },
        { provide: AppLoggerService,             useValue: mockLogger },
      ],
    }).compile();

    service = module.get(SearchService);
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('returns paginated results with facets', async () => {
      const res = await service.search({ q: 'سامسونگ', page: 1, limit: 10 });
      expect(res).toHaveProperty('products');
      expect(res).toHaveProperty('facets');
      expect(res).toHaveProperty('total');
      expect(productModel.find).toHaveBeenCalled();
    });

    it('adds text match when q is provided', async () => {
      await service.search({ q: 'سامسونگ' });
      const callArg = productModel.find.mock.calls[0][0];
      expect(callArg.$text).toEqual({ $search: 'سامسونگ' });
    });

    it('filters by inStock', async () => {
      await service.search({ inStock: true });
      const callArg = productModel.find.mock.calls[0][0];
      expect(callArg.totalStock).toEqual({ $gt: 0 });
    });

    it('parses attrs filter correctly', async () => {
      await service.search({ attrs: 'رنگ:مشکی,حافظه:128GB' });
      const callArg = productModel.find.mock.calls[0][0];
      expect(callArg['variants.attributes'].$all).toHaveLength(2);
    });

    it('sorts by viewCount descending when sort=mostViewed', async () => {
      await service.search({ sort: 'mostViewed' });
      const sortCall = productModel.find().select().sort.mock.calls[0][0];
      expect(sortCall).toEqual({ viewCount: -1, createdAt: -1 });
    });

    it('logs the search call with sort info', async () => {
      await service.search({ q: 'عینک', sort: 'mostViewed' });
      expect(mockLogger.log).toHaveBeenCalledWith('search', expect.objectContaining({ sort: 'mostViewed' }));
    });
  });

  describe('suggest', () => {
    it('returns cached result from Redis without hitting DB', async () => {
      const cached = { products: [{ name: 'سامسونگ A55', slug: 'samsung-a55' }], categories: [] };
      redis.get.mockResolvedValue(JSON.stringify(cached));
      const res = await service.suggest('سامسونگ');
      expect(res).toEqual(cached);
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it('queries DB on cache miss, returns { products, categories } and caches result', async () => {
      redis.get.mockResolvedValue(null);
      productModel.find.mockReturnValue(leanChain([{ name: 'سامسونگ A55', slug: 'samsung-a55' }]));
      categoryModel.find.mockReturnValue(leanChain([{ name: 'موبایل', slug: 'mobile' }]));

      const res = await service.suggest('سامسونگ');
      expect(res.products).toEqual([{ name: 'سامسونگ A55', slug: 'samsung-a55' }]);
      expect(res.categories).toEqual([{ name: 'موبایل', slug: 'mobile' }]);
      expect(redis.setex).toHaveBeenCalled();
    });

    it('uses v2 cache key to avoid collisions with old string[] cache', async () => {
      redis.get.mockResolvedValue(null);
      await service.suggest('test');
      const cacheKey: string = redis.get.mock.calls[0][0];
      expect(cacheKey).toContain('v2');
    });

    it('returns empty products and categories when DB has no matches', async () => {
      redis.get.mockResolvedValue(null);
      const res = await service.suggest('xyz_no_match');
      expect(res.products).toEqual([]);
      expect(res.categories).toEqual([]);
    });
  });

  describe('search history', () => {
    it('saves to Redis list and deduplicates', async () => {
      await service.saveHistory(userId, 'سامسونگ');
      expect(redis.lrem).toHaveBeenCalledWith(HISTORY_KEY_TEST(userId), 0, 'سامسونگ');
      expect(redis.lpush).toHaveBeenCalledWith(HISTORY_KEY_TEST(userId), 'سامسونگ');
    });

    it('returns history list', async () => {
      redis.lrange.mockResolvedValue(['سامسونگ', 'آیفون']);
      const res = await service.getHistory(userId);
      expect(res).toEqual(['سامسونگ', 'آیفون']);
    });

    it('clears history', async () => {
      await service.clearHistory(userId);
      expect(redis.del).toHaveBeenCalled();
    });
  });
});

function HISTORY_KEY_TEST(uid: string) {
  return `search:history:${uid}`;
}
