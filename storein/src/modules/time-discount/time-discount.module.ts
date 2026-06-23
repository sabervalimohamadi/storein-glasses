import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '../../redis/redis.module';
import { TimeDiscount, TimeDiscountSchema } from './schemas/time-discount.schema';
import { TimeDiscountController } from './time-discount.controller';
import { TimeDiscountService } from './time-discount.service';
import { TimeDiscountSchedulerService } from './time-discount-scheduler.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimeDiscount.name, schema: TimeDiscountSchema },
    ]),
    RedisModule,
  ],
  controllers: [TimeDiscountController],
  providers: [TimeDiscountService, TimeDiscountSchedulerService, AppLoggerService],
  exports: [TimeDiscountService],
})
export class TimeDiscountModule {}
