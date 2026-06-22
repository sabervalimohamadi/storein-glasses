import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TimeDiscountService } from './time-discount.service';

@Injectable()
export class TimeDiscountSchedulerService {
  private readonly logger = new Logger(TimeDiscountSchedulerService.name);

  constructor(private readonly timeDiscountService: TimeDiscountService) {}

  @Cron('0 */10 * * * *')
  async refreshDiscountCache() {
    const active = await this.timeDiscountService.refreshCache();
    this.logger.log(`Cache refreshed: ${active.length} active time-discounts`);
  }
}
