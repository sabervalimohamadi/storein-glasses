import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './entities/user.schema';
import { Order, OrderSchema } from '../order/entities/order.schema';
import { Review, ReviewSchema } from '../review/entities/review.schema';
import { GatewayModule } from '../../common/gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name,   schema: UserSchema   },
      { name: Order.name,  schema: OrderSchema  },
      { name: Review.name, schema: ReviewSchema },
    ]),
    GatewayModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
