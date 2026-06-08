import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as Joi from 'joi';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import otpConfig from './config/otp.config';
import uploadConfig from './config/upload.config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { SearchModule } from './modules/search/search.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReviewModule } from './modules/review/review.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { DiscountModule } from './modules/discount/discount.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './modules/upload/upload.module';
import { BrandModule } from './modules/brand/brand.module';
import { ColorModule } from './modules/color/color.module';
import { LoggerModule }          from './common/logger/logger.module';
import { RequestIdMiddleware }   from './common/middleware/request-id.middleware';
import { HttpLoggerMiddleware }  from './common/middleware/http-logger.middleware';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, otpConfig, uploadConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        MONGODB_URI: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
        OTP_EXPIRES_IN: Joi.number().required(),
        OTP_LENGTH: Joi.number().required(),
        UPLOAD_DEST:          Joi.string().default('./uploads'),
        UPLOAD_MAX_FILE_SIZE: Joi.number().default(5242880),
        UPLOAD_BASE_URL:      Joi.string().default('http://localhost:3000'),
      }),
    }),
    EventEmitterModule.forRoot({
      wildcard:          false,
      delimiter:         '.',
      newListener:       false,
      removeListener:    false,
      maxListeners:      10,
      verboseMemoryLeak: false,
      ignoreErrors:      false,
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UserModule,
    CategoryModule,
    ProductModule,
    SearchModule,
    CartModule,
    OrderModule,
    PaymentModule,
    ReviewModule,
    WishlistModule,
    DiscountModule,
    NotificationModule,
    AdminModule,
    UploadModule,
    BrandModule,
    ColorModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, HttpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
