import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationListener } from './notification.listener';
import { Notification, NotificationSchema } from './entities/notification.schema';
import {
  PushNotificationChannel,
  SmsNotificationChannel,
} from './channels/notification-channel.abstract';
import { MockSmsChannel } from './channels/mock-sms.channel';
import { MockPushChannel } from './channels/mock-push.channel';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationListener,
    { provide: SmsNotificationChannel,  useClass: MockSmsChannel },
    { provide: PushNotificationChannel, useClass: MockPushChannel },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
