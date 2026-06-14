import mongoose from 'mongoose';

const TEST_DB_NAME = `storein_e2e_${Date.now()}`;

declare global {
  // eslint-disable-next-line no-var
  var __TEST_DB_NAME__: string;
}

export default async function globalSetup(): Promise<void> {
  // Verify local MongoDB is reachable
  const uri = `mongodb://localhost:27017/${TEST_DB_NAME}`;
  await mongoose.connect(uri);
  await mongoose.disconnect();

  process.env.MONGODB_URI          = uri;
  process.env.NODE_ENV             = 'test';
  process.env.PORT                 = '3099';
  process.env.APP_NAME             = 'storein-test';
  process.env.JWT_SECRET           = 'test-jwt-secret-e2e-very-long-key';
  process.env.JWT_EXPIRES_IN       = '15m';
  process.env.JWT_REFRESH_SECRET   = 'test-jwt-refresh-secret-e2e-very-long-key';
  process.env.JWT_REFRESH_EXPIRES_IN = '30d';
  process.env.OTP_EXPIRES_IN       = '300';
  process.env.OTP_LENGTH           = '5';
  process.env.REDIS_HOST           = 'localhost';
  process.env.REDIS_PORT           = '6379';
  process.env.REDIS_TTL            = '300';
  process.env.UPLOAD_DEST          = './uploads-test';
  process.env.UPLOAD_MAX_FILE_SIZE = '5242880';
  process.env.UPLOAD_BASE_URL      = 'http://localhost:3099';
  process.env.PAYMENT_GATEWAY      = 'mock';
  process.env.PAYMENT_CALLBACK_URL = 'http://localhost:3099/api/v1/payments/verify';
  process.env.ZARINPAL_MERCHANT_ID = '';
  process.env.SMS_PROVIDER         = 'mock';
  process.env.KAVENEGAR_API_KEY    = '';
  process.env.KAVENEGAR_SENDER     = '';
  process.env.KAVENEGAR_OTP_TEMPLATE = 'storein-otp';
  process.env.ALLOWED_ORIGINS      = 'http://localhost:4000';

  global.__TEST_DB_NAME__ = TEST_DB_NAME;
}
