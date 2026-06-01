import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service';
import { Notification, NotificationType } from './entities/notification.schema';
import {
  PushNotificationChannel,
  SmsNotificationChannel,
} from './channels/notification-channel.abstract';

const userId  = new Types.ObjectId().toString();
const notifId = new Types.ObjectId().toString();

const mockNotif = (overrides: any = {}) => ({
  _id:    new Types.ObjectId(notifId),
  userId: new Types.ObjectId(userId),
  type:   NotificationType.ORDER_UPDATE,
  title:  'سفارش ORD-001',
  body:   'وضعیت سفارش شما تایید شد',
  data:   null,
  isRead: false,
  readAt: null,
  ...overrides,
});

describe('NotificationService', () => {
  let service: NotificationService;
  let notifModel: any;
  let smsChannel: jest.Mocked<SmsNotificationChannel>;
  let pushChannel: jest.Mocked<PushNotificationChannel>;

  const leanChain = (val: any) => ({ lean: jest.fn().mockResolvedValue(val) });

  const fullChain = (val: any) => ({
    select: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue(leanChain(val)),
        }),
      }),
    }),
  });

  beforeEach(async () => {
    notifModel = {
      create:           jest.fn(),
      find:             jest.fn().mockReturnValue(fullChain([])),
      findOneAndUpdate: jest.fn(),
      findByIdAndDelete:jest.fn(),
      updateMany:       jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      countDocuments:   jest.fn().mockResolvedValue(0),
      insertMany:       jest.fn().mockResolvedValue([]),
      db: {
        model: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(leanChain([])),
          }),
        }),
      },
    };

    smsChannel  = { send: jest.fn().mockResolvedValue(undefined) } as any;
    pushChannel = { send: jest.fn().mockResolvedValue(undefined) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getModelToken(Notification.name), useValue: notifModel },
        { provide: SmsNotificationChannel,           useValue: smsChannel },
        { provide: PushNotificationChannel,          useValue: pushChannel },
      ],
    }).compile();

    service = module.get(NotificationService);
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────────────────
  describe('create', () => {
    it('saves notification to DB', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(), toObject: () => mockNotif(),
      });

      const res = await service.create({
        userId, type: NotificationType.ORDER_UPDATE,
        title: 'سفارش', body: 'تایید شد',
      });

      expect(res.type).toBe(NotificationType.ORDER_UPDATE);
      expect(notifModel.create).toHaveBeenCalled();
    });

    it('fires SMS channel when phone provided (fire-and-forget)', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(), toObject: () => mockNotif(),
      });

      await service.create({
        userId, type: NotificationType.ORDER_UPDATE,
        title: 'سفارش', body: 'تایید شد',
        phone: '09121234567',
      });

      await new Promise(setImmediate);
      expect(smsChannel.send).toHaveBeenCalledWith('09121234567', 'تایید شد');
    });

    it('fires push channel by default', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(), toObject: () => mockNotif(),
      });

      await service.create({
        userId, type: NotificationType.SYSTEM,
        title: 'خبر', body: 'پیام جدید',
      });

      await new Promise(setImmediate);
      expect(pushChannel.send).toHaveBeenCalled();
    });
  });

  // ── getUserNotifications ──────────────────────────────────────
  describe('getUserNotifications', () => {
    it('returns notifications with unreadCount', async () => {
      notifModel.find.mockReturnValue(fullChain([mockNotif()]));
      notifModel.countDocuments
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      const res = await service.getUserNotifications(userId, {});
      expect(res.notifications).toHaveLength(1);
      expect(res.unreadCount).toBe(1);
    });
  });

  // ── markRead ──────────────────────────────────────────────────
  describe('markRead', () => {
    it('marks notification as read', async () => {
      notifModel.findOneAndUpdate.mockReturnValue(
        leanChain(mockNotif({ isRead: true, readAt: new Date() })),
      );

      const res = await service.markRead(userId, notifId);
      expect(res.isRead).toBe(true);
    });

    it('throws when notification not found or not owned', async () => {
      notifModel.findOneAndUpdate.mockReturnValue(leanChain(null));
      await expect(service.markRead(userId, notifId))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── markAllRead ───────────────────────────────────────────────
  describe('markAllRead', () => {
    it('returns modifiedCount', async () => {
      notifModel.updateMany.mockResolvedValue({ modifiedCount: 5 });
      const res = await service.markAllRead(userId);
      expect(res.modifiedCount).toBe(5);
    });
  });

  // ── getUnreadCount ────────────────────────────────────────────
  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      notifModel.countDocuments.mockResolvedValue(3);
      const res = await service.getUnreadCount(userId);
      expect(res.count).toBe(3);
    });
  });

  // ── adminBroadcast ────────────────────────────────────────────
  describe('adminBroadcast', () => {
    it('sends to specific user when targetUserId provided', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(), toObject: () => mockNotif(),
      });

      const res = await service.adminBroadcast({
        type:         NotificationType.PROMO,
        title:        'تخفیف',
        body:         'کد تخفیف ویژه',
        targetUserId: userId,
      });

      expect(res.sent).toBe(1);
      expect(notifModel.create).toHaveBeenCalled();
    });

    it('broadcasts to all active users', async () => {
      const users = [
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ];
      notifModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(leanChain(users)),
        }),
      });

      const res = await service.adminBroadcast({
        type: NotificationType.SYSTEM, title: 'همه', body: 'پیام عمومی',
      });

      expect(res.sent).toBe(3);
      expect(notifModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: NotificationType.SYSTEM }),
        ]),
        { ordered: false },
      );
    });
  });
});
