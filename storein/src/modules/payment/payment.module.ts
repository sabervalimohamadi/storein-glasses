import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Wallet, WalletSchema } from './entities/wallet.schema';
import { Transaction, TransactionSchema } from './entities/transaction.schema';
import { PaymentGateway } from './gateway/payment-gateway.abstract';
import { MockPaymentGateway } from './gateway/mock-payment-gateway.service';
import { OrderModule } from '../order/order.module';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name,      schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    OrderModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    AppLoggerService,
    { provide: PaymentGateway, useClass: MockPaymentGateway },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
