import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { Product } from '../product/entities/product.schema';
import { Category } from '../category/entities/category.schema';
import { REDIS_CLIENT } from '../../redis/redis.module';

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
  });

  describe('suggest', () => {
    it('returns cached suggestions from Redis', async () => {
      redis.get.mockResolvedValue(JSON.stringify(['سامسونگ A55']));
      const res = await service.suggest('سامسونگ');
      expect(res).toEqual(['سامسونگ A55']);
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it('queries DB when cache miss and caches result', async () => {
      redis.get.mockResolvedValue(null);
      productModel.find.mockReturnValue(leanChain([{ name: 'سامسونگ A55' }]));
      categoryModel.find.mockReturnValue(leanChain([]));

      const res = await service.suggest('سامسونگ');
      expect(redis.setex).toHaveBeenCalled();
      expect(res).toContain('سامسونگ A55');
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
