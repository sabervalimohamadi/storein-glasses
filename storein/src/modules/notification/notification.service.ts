import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './entities/notification.schema';
import {
  ChannelPayload,
  PushNotificationChannel,
  SmsNotificationChannel,
} from './channels/notification-channel.abstract';
import { AdminBroadcastDto } from './dto/admin-broadcast.dto';
import { AdminSmsDto }       from './dto/admin-sms.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

export interface CreateNotificationPayload {
  userId:    string;
  type:      NotificationType;
  title:     string;
  body:      string;
  data?:     Record<string, any>;
  phone?:    string;
  sendPush?: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
    private smsChannel:  SmsNotificationChannel,
    private pushChannel: PushNotificationChannel,
  ) {}

  // ── Create (internal — called by listener or admin) ───────────
  async create(payload: CreateNotificationPayload): Promise<NotificationDocument> {
    const notif = await this.notifModel.create({
      userId: new Types.ObjectId(payload.userId),
      type:   payload.type,
      title:  payload.title,
      body:   payload.body,
      data:   payload.data ?? null,
    });

    if (payload.phone) {
      this.smsChannel
        .send(payload.phone, payload.body)
        .catch((err) =>
          this.logger.error(`SMS notify failed: ${err.message}`),
        );
    }

    if (payload.sendPush !== false) {
      const pushPayload: ChannelPayload = {
        userId: payload.userId,
        title:  payload.title,
        body:   payload.body,
        data:   payload.data,
      };
      this.pushChannel
        .send(pushPayload)
        .catch((err) =>
          this.logger.error(`Push notify failed: ${err.message}`),
        );
    }

    return notif.toObject();
  }

  // ── User: Get notifications ───────────────────────────────────
  async getUserNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{
    notifications: NotificationDocument[];
    total: number;
    unreadCount: number;
    totalPages: number;
  }> {
    const { unreadOnly, page = 1, limit = 20 } = query;
    const oid = new Types.ObjectId(userId);

    const filter: Record<string, any> = { userId: oid };
    if (unreadOnly) filter.isRead = false;

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notifModel
        .find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<NotificationDocument[]>(),
      this.notifModel.countDocuments(filter),
      this.notifModel.countDocuments({ userId: oid, isRead: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── User: Mark one as read ────────────────────────────────────
  async markRead(userId: string, notifId: string): Promise<NotificationDocument> {
    const notif = await this.notifModel
      .findOneAndUpdate(
        {
          _id:    new Types.ObjectId(notifId),
          userId: new Types.ObjectId(userId),
        },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true },
      )
      .lean<NotificationDocument>();

    if (!notif) throw new NotFoundException('اعلان یافت نشد');
    return notif;
  }

  // ── User: Mark all as read ────────────────────────────────────
  async markAllRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
    return { modifiedCount: result.modifiedCount };
  }

  // ── User: Unread count ────────────────────────────────────────
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notifModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
    return { count };
  }

  // ── Admin: Broadcast or targeted send ────────────────────────
  async adminBroadcast(dto: AdminBroadcastDto): Promise<{ sent: number }> {
    if (dto.targetUserId) {
      await this.create({
        userId: dto.targetUserId,
        type:   dto.type,
        title:  dto.title,
        body:   dto.body,
        data:   dto.data,
      });
      return { sent: 1 };
    }

    const UserModel = this.notifModel.db.model('User');
    const users: any[] = await UserModel
      .find({ isActive: true })
      .select('_id')
      .lean();

    const docs = users.map((u) => ({
      userId: u._id,
      type:   dto.type,
      title:  dto.title,
      body:   dto.body,
      data:   dto.data ?? null,
      isRead: false,
      readAt: null,
    }));

    if (docs.length > 0) {
      await this.notifModel.insertMany(docs, { ordered: false });
    }

    this.logger.log(`Broadcast sent to ${docs.length} users`);
    return { sent: docs.length };
  }

  // ── Admin: Send SMS (targeted or broadcast) ──────────────────
  async adminSendSms(dto: AdminSmsDto): Promise<{ sent: number; failed: number }> {
    const normalizePhone = (p: string) =>
      p.startsWith('+98') ? '0' + p.slice(3) : p;

    if (dto.phone) {
      const phone = normalizePhone(dto.phone);
      await this.smsChannel.send(phone, dto.message);
      this.logger.log(`Admin SMS sent to single target: ${phone.slice(0, -4)}****`);
      return { sent: 1, failed: 0 };
    }

    const UserModel = this.notifModel.db.model('User');
    const users: any[] = await UserModel
      .find({ isActive: true })
      .select('phone')
      .lean();

    let sent   = 0;
    let failed = 0;

    for (const user of users) {
      if (!user.phone) continue;
      try {
        await this.smsChannel.send(user.phone, dto.message);
        sent++;
      } catch (err: any) {
        failed++;
        this.logger.error(`Admin SMS broadcast failed for ${user.phone.slice(0, -4)}****: ${err?.message}`);
      }
    }

    this.logger.log(`Admin SMS broadcast complete — sent: ${sent}, failed: ${failed}`);
    return { sent, failed };
  }

  // ── Admin: Delete notification ────────────────────────────────
  async adminDelete(notifId: string): Promise<void> {
    if (!Types.ObjectId.isValid(notifId)) return;
    await this.notifModel.findByIdAndDelete(notifId);
  }
}
