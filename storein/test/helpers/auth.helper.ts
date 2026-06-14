import { INestApplication } from '@nestjs/common';
import request              from 'supertest';
import { getOtpFromRedis }  from './seed.helper';

export interface AuthSession {
  accessToken: string;
  /** Value to pass to `.set('Cookie', cookie)` — just the `refresh_token=JWT` part. */
  cookie: string;
  phone: string;
}

/** Decodes the JWT payload without verifying signature. */
export function parseAccessToken(token: string): { sub: string; phone: string; iat: number; exp: number } {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

/** Generates a valid random Iranian mobile phone number. */
export function generateTestPhone(): string {
  const rand = Math.floor(Math.random() * 9_000_000) + 1_000_000;
  return `0912${rand}`;
}

/**
 * Full login flow:
 *  1. POST /auth/send-otp
 *  2. Read OTP from ioredis-mock
 *  3. POST /auth/verify-otp
 * Returns { accessToken, cookie, phone }.
 */
export async function loginAsNewUser(
  app: INestApplication,
  phone = generateTestPhone(),
): Promise<AuthSession> {
  await request(app.getHttpServer())
    .post('/api/v1/auth/send-otp')
    .send({ phone })
    .expect(200);

  const otp = await getOtpFromRedis(app, phone);

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/verify-otp')
    .send({ phone, code: otp })
    .expect(200);

  const setCookieHeader = (res.headers['set-cookie'] as string[] | undefined) ?? [];
  const fullCookie      = setCookieHeader.find(c => c.startsWith('refresh_token=')) ?? '';
  // Cookie header for subsequent requests must be just 'refresh_token=JWT'
  const cookie          = fullCookie.split(';')[0];

  return { accessToken: res.body.accessToken, cookie, phone };
}

/**
 * Calls POST /auth/refresh with the current cookie.
 * Returns the new access token and rotated cookie.
 */
export async function refreshSession(
  app: INestApplication,
  cookie: string,
): Promise<{ accessToken: string; newCookie: string }> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookie)
    .expect(200);

  const setCookieHeader = (res.headers['set-cookie'] as string[] | undefined) ?? [];
  const fullCookie      = setCookieHeader.find(c => c.startsWith('refresh_token=')) ?? '';
  const newCookie       = fullCookie.split(';')[0];

  return { accessToken: res.body.accessToken, newCookie };
}
