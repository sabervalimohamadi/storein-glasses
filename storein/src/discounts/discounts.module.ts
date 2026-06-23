import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Discount, DiscountSchema } from './schemas/discount.schema';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { DiscountSchedulerService } from './discount-scheduler.service';
import { AppLoggerService } from '../common/logger/app-logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Discount.name, schema: DiscountSchema },
    ]),
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService, DiscountSchedulerService, AppLoggerService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
