import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv:             process.env.NODE_ENV || 'development',
  port:                parseInt(process.env.PORT ?? '3000', 10) || 3000,
  name:                process.env.APP_NAME || 'storein',
  allowedOrigins:      (process.env.ALLOWED_ORIGINS ?? 'http://localhost:4000,http://localhost:5173')
                         .split(',').map(o => o.trim()).filter(Boolean),
  paymentCallbackUrl:  process.env.PAYMENT_CALLBACK_URL ?? 'http://localhost:3000/api/v1/payments/verify',
}));
