import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentService } from './payment.service';
import { Wallet } from './entities/wallet.schema';
import {
  Transaction, TransactionStatus,
  TransactionType, PaymentMethod,
} from './entities/transaction.schema';
import { PaymentGateway } from './gateway/payment-gateway.abstract';
import { OrderService } from '../order/order.service';
import { OrderStatus } from '../order/entities/order.schema';

const userId  = new Types.ObjectId().toString();
const orderId = new Types.ObjectId().toString();

const mockOrder = (overrides: any = {}) => ({
  _id:         new Types.ObjectId(orderId),
  orderNumber: 'ORD-001',
  total:       20_000_000,
  status:      OrderStatus.PENDING,
  ...overrides,
});

const mockWallet = (balance = 30_000_000) => ({
  userId:   new Types.ObjectId(userId),
  balance,
  isActive: true,
});

describe('PaymentService', () => {
  let service: PaymentService;
  let walletModel: any;
  let txModel: any;
  let gateway: jest.Mocked<PaymentGateway>;
  let orderService: jest.Mocked<OrderService>;
  let eventEmitter: jest.Mocked<any>;

  const userDbChain = (phone = '09121234567') => ({
    model: jest.fn().mockReturnValue({
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ phone }),
        }),
      }),
    }),
  });

  beforeEach(async () => {
    walletModel = {
      findOneAndUpdate: jest.fn(),
      findOne:          jest.fn(),
      db:               userDbChain(),
    };

    txModel = {
      create:            jest.fn().mockResolvedValue({}),
      findOne:           jest.fn(),
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
      find:              jest.fn(),
      countDocuments:    jest.fn().mockResolvedValue(0),
    };

    gateway = {
      create: jest.fn().mockResolvedValue({
        authority:  'MOCK-AUTH-001',
        gatewayUrl: 'http://mock-gateway/pay',
      }),
      verify: jest.fn().mockResolvedValue({ success: true, refId: 'REF-001' }),
    } as any;

    orderService = {
      findMyOrderById: jest.fn().mockResolvedValue(mockOrder()),
      updateStatus:    jest.fn().mockResolvedValue({}),
    } as any;

    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getModelToken(Wallet.name),      useValue: walletModel },
        { provide: getModelToken(Transaction.name), useValue: txModel },
        { provide: PaymentGateway,                  useValue: gateway },
        { provide: OrderService,                    useValue: orderService },
        { provide: EventEmitter2,                   useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(PaymentService);
    jest.clearAllMocks();
  });

  // ── getOrCreateWallet ─────────────────────────────────────────
  describe('getOrCreateWallet', () => {
    it('creates wallet if not exists (upsert)', async () => {
      walletModel.findOneAndUpdate.mockResolvedValue(mockWallet());
      const w = await service.getOrCreateWallet(userId);
      expect(w.balance).toBe(30_000_000);
      expect(walletModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ $setOnInsert: expect.any(Object) }),
        expect.objectContaining({ upsert: true, new: true }),
      );
    });
  });

  // ── payOrder — wallet ─────────────────────────────────────────
  describe('payOrder — wallet', () => {
    it('debits wallet and confirms order', async () => {
      orderService.findMyOrderById.mockResolvedValue(mockOrder());
      walletModel.findOneAndUpdate.mockResolvedValue(mockWallet());

      const res = await service.payOrder(userId, {
        orderId, method: PaymentMethod.WALLET,
      });

      expect(res.success).toBe(true);
      expect(walletModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ balance: { $gte: 20_000_000 } }),
        expect.objectContaining({ $inc: { balance: -20_000_000 } }),
      );
      expect(orderService.updateStatus).toHaveBeenCalledWith(
        orderId, { status: OrderStatus.CONFIRMED },
      );
    });

    it('throws when wallet balance insufficient', async () => {
      walletModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(
        service.payOrder(userId, { orderId, method: PaymentMethod.WALLET }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when order not in pending status', async () => {
      orderService.findMyOrderById.mockResolvedValue(
        mockOrder({ status: OrderStatus.CONFIRMED }),
      );
      await expect(
        service.payOrder(userId, { orderId, method: PaymentMethod.WALLET }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── payOrder — gateway ────────────────────────────────────────
  describe('payOrder — gateway', () => {
    it('creates pending tx and returns gateway URL', async () => {
      const res = await service.payOrder(userId, {
        orderId, method: PaymentMethod.GATEWAY,
      });

      expect(res.success).toBe(false);
      expect(res.gatewayUrl).toBe('http://mock-gateway/pay');
      expect(res.authority).toBe('MOCK-AUTH-001');
      expect(txModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: TransactionStatus.PENDING }),
      );
    });
  });

  // ── payOrder — mixed ──────────────────────────────────────────
  describe('payOrder — mixed', () => {
    it('throws when walletAmount is zero', async () => {
      await expect(
        service.payOrder(userId, {
          orderId, method: PaymentMethod.MIXED, walletAmount: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when wallet balance insufficient for wallet portion', async () => {
      walletModel.findOneAndUpdate.mockResolvedValue(mockWallet(1_000));
      await expect(
        service.payOrder(userId, {
          orderId, method: PaymentMethod.MIXED, walletAmount: 5_000_000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates pending tx for gateway portion', async () => {
      walletModel.findOneAndUpdate.mockResolvedValue(mockWallet(10_000_000));

      const res = await service.payOrder(userId, {
        orderId, method: PaymentMethod.MIXED, walletAmount: 5_000_000,
      });

      expect(res.gatewayUrl).toBeDefined();
      expect(txModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          walletAmount:  5_000_000,
          gatewayAmount: 15_000_000,
        }),
      );
    });
  });

  // ── verifyPayment ─────────────────────────────────────────────
  describe('verifyPayment', () => {
    const mockPendingTx = (overrides: any = {}) => ({
      _id:           new Types.ObjectId(),
      userId:        new Types.ObjectId(userId),
      orderId:       new Types.ObjectId(orderId),
      status:        TransactionStatus.PENDING,
      method:        PaymentMethod.GATEWAY,
      amount:        20_000_000,
      gatewayAmount: 20_000_000,
      walletAmount:  0,
      ...overrides,
    });

    it('confirms order on successful gateway verify', async () => {
      txModel.findOne.mockResolvedValue(mockPendingTx());
      gateway.verify.mockResolvedValue({ success: true, refId: 'REF-OK' });

      const res = await service.verifyPayment('MOCK-AUTH-001', 'OK');

      expect(res.success).toBe(true);
      expect(res.refId).toBe('REF-OK');
      expect(orderService.updateStatus).toHaveBeenCalledWith(
        orderId, { status: OrderStatus.CONFIRMED },
      );
    });

    it('marks tx failed when user cancels (status=NOK)', async () => {
      txModel.findOne.mockResolvedValue(mockPendingTx());

      const res = await service.verifyPayment('MOCK-AUTH-001', 'NOK');

      expect(res.success).toBe(false);
      expect(txModel.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        { status: TransactionStatus.FAILED },
      );
    });

    it('credits wallet when orderId is null (top-up)', async () => {
      txModel.findOne.mockResolvedValue(
        mockPendingTx({ orderId: null, amount: 50_000_000 }),
      );
      walletModel.findOneAndUpdate.mockResolvedValue({});

      const res = await service.verifyPayment('MOCK-AUTH-001', 'OK');

      expect(res.message).toContain('کیف پول');
      expect(walletModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ $inc: { balance: 50_000_000 } }),
        expect.any(Object),
      );
    });

    it('throws when tx not found', async () => {
      txModel.findOne.mockResolvedValue(null);
      await expect(
        service.verifyPayment('INVALID', 'OK'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── topupWallet ───────────────────────────────────────────────
  describe('topupWallet', () => {
    it('creates pending tx and returns gateway URL', async () => {
      const res = await service.topupWallet(userId, { amount: 50_000_000 });
      expect(res.gatewayUrl).toBeDefined();
      expect(res.authority).toBe('MOCK-AUTH-001');
      expect(txModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type:   TransactionType.CREDIT,
          amount: 50_000_000,
          status: TransactionStatus.PENDING,
        }),
      );
    });
  });
});
