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
import { MockSmsChannel }      from './channels/mock-sms.channel';
import { MockPushChannel }     from './channels/mock-push.channel';
import { KavenegarSmsChannel } from './channels/kavenegar-sms.channel';
import { DynamicSmsChannel }   from './channels/dynamic-sms.channel';
import { SettingsModule }      from '../settings/settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    SettingsModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationListener,
    MockSmsChannel,
    KavenegarSmsChannel,
    DynamicSmsChannel,
    { provide: SmsNotificationChannel,  useExisting: DynamicSmsChannel },
    { provide: PushNotificationChannel, useClass: MockPushChannel },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
