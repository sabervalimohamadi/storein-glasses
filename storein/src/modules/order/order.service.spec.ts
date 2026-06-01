import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderService } from './order.service';
import { Order, OrderStatus } from './entities/order.schema';
import { User } from '../user/entities/user.schema';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { DiscountService } from '../discount/discount.service';

const userId  = new Types.ObjectId().toString();
const orderId = new Types.ObjectId().toString();
const addrId  = new Types.ObjectId();
const prodId  = new Types.ObjectId().toString();
const varId   = new Types.ObjectId().toString();

const mockAddress = () => ({
  _id:            { toString: () => addrId.toString() },
  recipientName:  'علی رضایی',
  recipientPhone: '09121111111',
  province: 'تهران', city: 'تهران',
  street: 'آزادی', detail: 'پ۱', postalCode: '1234567890',
});

const mockCartItem = () => ({
  productId: prodId, variantId: varId, sku: 'SKU-1',
  name: 'سامسونگ A55', thumbnail: null,
  price: 10_000_000, comparePrice: null,
  quantity: 2, stock: 5, attributes: [],
});

const mockProductVariant = () => ({
  _id: { toString: () => varId },
  sku: 'SKU-1', price: 10_000_000,
  stock: 5, isActive: true, attributes: [],
});

const mockOrder = (overrides: any = {}) => ({
  _id:         new Types.ObjectId(orderId),
  userId:      new Types.ObjectId(userId),
  orderNumber: 'ORD-123-TEST',
  status:      OrderStatus.PENDING,
  items: [{
    productId: new Types.ObjectId(prodId),
    variantId: varId, sku: 'SKU-1', name: 'سامسونگ A55',
    price: 10_000_000, quantity: 2, attributes: [],
  }],
  subtotal: 20_000_000, total: 20_000_000,
  save:     jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnThis(),
  ...overrides,
});

describe('OrderService', () => {
  let service: OrderService;
  let orderModel: any;
  let userModel: any;
  let cartService: jest.Mocked<any>;
  let productService: jest.Mocked<any>;
  let discountService: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<any>;

  beforeEach(async () => {
    orderModel = {
      create:         jest.fn(),
      find:           jest.fn(),
      findOne:        jest.fn(),
      findById:       jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    userModel        = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      }),
    };
    cartService      = { getRawCart: jest.fn(), clearCart: jest.fn() };
    productService   = { findById: jest.fn(), adjustStock: jest.fn().mockResolvedValue({}) };
    discountService  = { validate: jest.fn(), recordUsage: jest.fn().mockResolvedValue(undefined) };
    eventEmitter     = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(User.name),  useValue: userModel },
        { provide: CartService,               useValue: cartService },
        { provide: ProductService,            useValue: productService },
        { provide: DiscountService,           useValue: discountService },
        { provide: EventEmitter2,             useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(OrderService);
    jest.clearAllMocks();
  });

  describe('createFromCart', () => {
    beforeEach(() => {
      cartService.getRawCart.mockResolvedValue({
        userId, updatedAt: '', items: [mockCartItem()],
      });
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ addresses: [mockAddress()] }),
        }),
      });
      productService.findById.mockResolvedValue({
        variants: [mockProductVariant()],
      });
      orderModel.create.mockResolvedValue({
        ...mockOrder(), toObject: () => mockOrder(),
      });
    });

    it('creates order, decrements stock, clears cart', async () => {
      await service.createFromCart(userId, { addressId: addrId.toString() });

      expect(orderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ total: 20_000_000 }),
      );
      expect(productService.adjustStock).toHaveBeenCalledWith(prodId, varId, -2);
      expect(cartService.clearCart).toHaveBeenCalledWith(userId);
    });

    it('throws when cart is empty', async () => {
      cartService.getRawCart.mockResolvedValue({ userId, updatedAt: '', items: [] });
      await expect(
        service.createFromCart(userId, { addressId: addrId.toString() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when address not found', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ addresses: [] }),
        }),
      });
      await expect(
        service.createFromCart(userId, { addressId: addrId.toString() }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when stock insufficient', async () => {
      productService.findById.mockResolvedValue({
        variants: [{ ...mockProductVariant(), stock: 1 }],
      });
      await expect(
        service.createFromCart(userId, { addressId: addrId.toString() }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelMyOrder', () => {
    it('cancels and restores stock', async () => {
      const order = mockOrder();
      orderModel.findOne.mockResolvedValue(order);

      await service.cancelMyOrder(userId, orderId);

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(productService.adjustStock).toHaveBeenCalledWith(prodId, varId, 2);
      expect(order.save).toHaveBeenCalled();
    });

    it('throws when order not found', async () => {
      orderModel.findOne.mockResolvedValue(null);
      await expect(service.cancelMyOrder(userId, orderId))
        .rejects.toThrow(NotFoundException);
    });

    it('throws when cancelling a delivered order', async () => {
      orderModel.findOne.mockResolvedValue(
        mockOrder({ status: OrderStatus.DELIVERED }),
      );
      await expect(service.cancelMyOrder(userId, orderId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('transitions pending → confirmed', async () => {
      const order = mockOrder();
      orderModel.findById.mockResolvedValue(order);

      await service.updateStatus(orderId, { status: OrderStatus.CONFIRMED });
      expect(order.status).toBe(OrderStatus.CONFIRMED);
    });

    it('throws on illegal transition delivered → cancelled', async () => {
      orderModel.findById.mockResolvedValue(
        mockOrder({ status: OrderStatus.DELIVERED }),
      );
      await expect(
        service.updateStatus(orderId, { status: OrderStatus.CANCELLED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('restores stock when admin cancels', async () => {
      const order = mockOrder({ status: OrderStatus.CONFIRMED });
      orderModel.findById.mockResolvedValue(order);

      await service.updateStatus(orderId, {
        status: OrderStatus.CANCELLED,
        cancelReason: 'موجود نیست',
      });

      expect(productService.adjustStock).toHaveBeenCalledWith(prodId, varId, 2);
      expect(order.cancelReason).toBe('موجود نیست');
    });
  });
});
