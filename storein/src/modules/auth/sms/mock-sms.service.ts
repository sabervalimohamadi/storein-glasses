import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms.service.abstract';

@Injectable()
export class MockSmsService extends SmsService {
  private readonly logger = new Logger(MockSmsService.name);
  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`📱 [MOCK SMS] → ${phone} | OTP: ${code}`);
  }
}
