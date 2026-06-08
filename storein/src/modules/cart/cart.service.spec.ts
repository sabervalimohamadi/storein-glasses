import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CartService } from './cart.service';
import { Product } from '../product/entities/product.schema';
import { REDIS_CLIENT } from '../../redis/redis.module';
import type { Cart } from './cart.interface';

const userId = 'user_001';
const prodId = new Types.ObjectId().toString();
const varId  = new Types.ObjectId().toString();

const mockVariant = (overrides = {}) => ({
  _id:          { toString: () => varId },
  sku:          'SKU-1',
  price:        10_000_000,
  comparePrice: 12_000_000,
  stock:        5,
  isActive:     true,
  attributes:   [{ key: 'رنگ', value: 'مشکی' }],
  ...overrides,
});

const mockProduct = () => ({
  _id:       { toString: () => prodId },
  name:      'سامسونگ A55',
  thumbnail: null,
  variants:  [mockVariant()],
});

const cartWithItem = (): Cart => ({
  userId,
  updatedAt: '',
  items: [{
    productId:    prodId,
    variantId:    varId,
    sku:          'SKU-1',
    name:         'سامسونگ A55',
    slug:         'samsung-a55',
    thumbnail:    null,
    price:        10_000_000,
    comparePrice: 12_000_000,
    quantity:     2,
    stock:        5,
    attributes:   [],
  }],
});

describe('CartService', () => {
  let service: CartService;
  let redis: jest.Mocked<any>;
  let productModel: any;

  beforeEach(async () => {
    redis = {
      get:   jest.fn().mockResolvedValue(null),
      setex: jest.fn(),
      del:   jest.fn(),
    };

    productModel = {
      findById: jest.fn(),
      find:     jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: REDIS_CLIENT,                useValue: redis },
      ],
    }).compile();

    service = module.get(CartService);
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('returns empty summary for new user', async () => {
      const res = await service.getCart(userId);
      expect(res.items).toHaveLength(0);
      expect(res.subtotal).toBe(0);
      expect(res.totalItems).toBe(0);
      expect(res.savings).toBe(0);
    });

    it('auto-removes items whose product was deleted', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const res = await service.getCart(userId);
      expect(res.items).toHaveLength(0);
    });

    it('refreshes stock from DB', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{
            _id:      { toString: () => prodId },
            variants: [mockVariant({ stock: 3 })],
          }]),
        }),
      });

      const res = await service.getCart(userId);
      expect(res.items[0].stock).toBe(3);
    });
  });

  describe('addItem', () => {
    beforeEach(() => {
      productModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockProduct()),
        }),
      });
    });

    it('adds new item to empty cart', async () => {
      const res = await service.addItem(userId, {
        productId: prodId, variantId: varId, quantity: 2,
      });
      expect(res.items).toHaveLength(1);
      expect(res.items[0].quantity).toBe(2);
      expect(res.subtotal).toBe(20_000_000);
      expect(redis.setex).toHaveBeenCalled();
    });

    it('increments quantity for existing item', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      const res = await service.addItem(userId, {
        productId: prodId, variantId: varId, quantity: 1,
      });
      expect(res.items[0].quantity).toBe(3);
    });

    it('throws when quantity exceeds stock', async () => {
      await expect(
        service.addItem(userId, { productId: prodId, variantId: varId, quantity: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when product not found', async () => {
      productModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(
        service.addItem(userId, { productId: prodId, variantId: varId, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateItem', () => {
    it('updates quantity', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      const res = await service.updateItem(userId, prodId, {
        variantId: varId, quantity: 4,
      });
      expect(res.items[0].quantity).toBe(4);
    });

    it('removes item when quantity is 0', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      const res = await service.updateItem(userId, prodId, {
        variantId: varId, quantity: 0,
      });
      expect(res.items).toHaveLength(0);
    });

    it('throws when item not in cart', async () => {
      redis.get.mockResolvedValue(null);
      await expect(
        service.updateItem(userId, prodId, { variantId: varId, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      const res = await service.removeItem(userId, prodId, varId);
      expect(res.items).toHaveLength(0);
    });

    it('throws when item not in cart', async () => {
      redis.get.mockResolvedValue(null);
      await expect(
        service.removeItem(userId, prodId, varId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('buildSummary (savings)', () => {
    it('calculates savings correctly', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{
            _id:      { toString: () => prodId },
            variants: [mockVariant()],
          }]),
        }),
      });

      const res = await service.getCart(userId);
      expect(res.savings).toBe(4_000_000);
      expect(res.subtotal).toBe(20_000_000);
    });
  });
});
