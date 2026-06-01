import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';
import { Coupon, CouponSchema } from './entities/coupon.schema';
import { CouponUsage, CouponUsageSchema } from './entities/coupon-usage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name,      schema: CouponSchema },
      { name: CouponUsage.name, schema: CouponUsageSchema },
    ]),
  ],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports: [DiscountService],
})
export class DiscountModule {}
