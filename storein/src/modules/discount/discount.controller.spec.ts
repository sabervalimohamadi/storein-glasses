import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';
import { DiscountType } from './entities/coupon.schema';

const mockService = {
  validate:        jest.fn(),
  adminCreate:     jest.fn(),
  adminFindAll:    jest.fn(),
  adminFindById:   jest.fn(),
  adminUpdate:     jest.fn(),
  adminDeactivate: jest.fn(),
  adminGetUsage:   jest.fn(),
};

const couponId = new Types.ObjectId().toString();
const userId   = new Types.ObjectId().toString();
const mockUser = { _id: { toString: () => userId } } as any;

const now    = new Date();
const past   = new Date(now.getTime() - 86400_000).toISOString();
const future = new Date(now.getTime() + 86400_000).toISOString();

describe('DiscountController', () => {
  let controller: DiscountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscountController],
      providers: [{ provide: DiscountService, useValue: mockService }],
    }).compile();

    controller = module.get(DiscountController);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('returns valid result with discount amount', async () => {
      mockService.validate.mockResolvedValue({ isValid: true, discountAmount: 2_000_000 });
      const result = await controller.validate(mockUser, { code: 'SAVE20', cartTotal: 10_000_000 });
      expect(result.isValid).toBe(true);
      expect(mockService.validate).toHaveBeenCalledWith(userId, 'SAVE20', 10_000_000);
    });

    it('returns invalid when coupon expired', async () => {
      mockService.validate.mockResolvedValue({ isValid: false, discountAmount: 0, message: 'منقضی' });
      const result = await controller.validate(mockUser, { code: 'OLD', cartTotal: 5_000_000 });
      expect(result.isValid).toBe(false);
    });
  });

  describe('create', () => {
    const dto = {
      code: 'NEWCODE', type: DiscountType.FIXED, value: 100_000,
      startDate: past, endDate: future,
    };

    it('creates coupon and returns it', async () => {
      mockService.adminCreate.mockResolvedValue({ code: 'NEWCODE' });
      const result = await controller.create(dto as any);
      expect(result.code).toBe('NEWCODE');
    });

    it('propagates ConflictException on duplicate code', async () => {
      mockService.adminCreate.mockRejectedValue(new ConflictException());
      await expect(controller.create(dto as any)).rejects.toThrow(ConflictException);
    });

    it('propagates BadRequestException on invalid dates', async () => {
      mockService.adminCreate.mockRejectedValue(new BadRequestException());
      await expect(controller.create(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns paginated coupons', async () => {
      mockService.adminFindAll.mockResolvedValue({ coupons: [], total: 0 });
      await controller.findAll(1, 20, 'true');
      expect(mockService.adminFindAll).toHaveBeenCalledWith(1, 20, true);
    });

    it('passes undefined for isActive when not provided', async () => {
      mockService.adminFindAll.mockResolvedValue({ coupons: [], total: 0 });
      await controller.findAll(1, 20, undefined);
      expect(mockService.adminFindAll).toHaveBeenCalledWith(1, 20, undefined);
    });
  });

  describe('findById', () => {
    it('returns coupon by id', async () => {
      mockService.adminFindById.mockResolvedValue({ _id: couponId, code: 'SAVE20' });
      const result = await controller.findById(couponId);
      expect(result.code).toBe('SAVE20');
    });

    it('propagates NotFoundException', async () => {
      mockService.adminFindById.mockRejectedValue(new NotFoundException());
      await expect(controller.findById(couponId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns coupon', async () => {
      mockService.adminUpdate.mockResolvedValue({ code: 'SAVE20', value: 30 });
      const result = await controller.update(couponId, { value: 30 } as any);
      expect(result.value).toBe(30);
    });

    it('propagates ConflictException on duplicate code', async () => {
      mockService.adminUpdate.mockRejectedValue(new ConflictException());
      await expect(controller.update(couponId, { code: 'EXISTS' } as any))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('deactivate', () => {
    it('deactivates coupon', async () => {
      mockService.adminDeactivate.mockResolvedValue({ isActive: false });
      const result = await controller.deactivate(couponId);
      expect(result.isActive).toBe(false);
      expect(mockService.adminDeactivate).toHaveBeenCalledWith(couponId);
    });

    it('propagates NotFoundException', async () => {
      mockService.adminDeactivate.mockRejectedValue(new NotFoundException());
      await expect(controller.deactivate(couponId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUsage', () => {
    it('returns paginated usages', async () => {
      mockService.adminGetUsage.mockResolvedValue({ usages: [], total: 0 });
      await controller.getUsage(couponId, 1, 20);
      expect(mockService.adminGetUsage).toHaveBeenCalledWith(couponId, 1, 20);
    });
  });
});
