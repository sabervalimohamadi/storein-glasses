import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentGateway,
  GatewayCreateResult,
  GatewayVerifyResult,
} from './payment-gateway.abstract';

@Injectable()
export class MockPaymentGateway extends PaymentGateway {
  private readonly logger = new Logger(MockPaymentGateway.name);

  async create(
    amount: number,
    description: string,
    callbackUrl: string,
  ): Promise<GatewayCreateResult> {
    const authority = `MOCK-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    this.logger.log(
      `💳 [MOCK GATEWAY] Created | amount: ${amount} | authority: ${authority}`,
    );

    return {
      authority,
      gatewayUrl: `http://localhost:3000/mock-pay?authority=${authority}&callback=${encodeURIComponent(callbackUrl)}`,
    };
  }

  async verify(authority: string, amount: number): Promise<GatewayVerifyResult> {
    const refId = `REF-${Date.now()}`;
    this.logger.log(
      `✅ [MOCK GATEWAY] Verified | authority: ${authority} | refId: ${refId}`,
    );
    return { success: true, refId };
  }
}
