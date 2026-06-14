import { INestApplication } from '@nestjs/common';
import { getModelToken }    from '@nestjs/mongoose';
import { Model }            from 'mongoose';
import request              from 'supertest';
import { createTestApp }    from './helpers/app.helper';
import {
  createTestCategory,
  createTestProduct,
  addAddressToUser,
  creditWallet,
} from './helpers/seed.helper';
import {
  loginAsNewUser,
  parseAccessToken,
} from './helpers/auth.helper';

describe('Payment flow (e2e)', () => {
  let app: INestApplication;
  let category: any;
  let product: any;
  let variantId: string;
  let productModel: Model<any>;

  beforeAll(async () => {
    app          = await createTestApp();
    productModel = app.get<Model<any>>(getModelToken('Product'));
    category     = await createTestProduct(app, (await createTestCategory(app))._id.toString());

    // Use a dedicated product for payment tests (price = 100_000)
    category = await createTestCategory(app);
    product  = await createTestProduct(app, category._id.toString(), {
      variants: [{
        sku:          'PAY-SKU-001',
        price:        50_000,
        comparePrice: null,
        stock:        20,
        isActive:     true,
        attributes:   [],
      }],
      minPrice:   50_000,
      maxPrice:   50_000,
      totalStock: 20,
    });
    variantId = product.variants[0]._id.toString();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await productModel.updateOne(
      { _id: product._id },
      { $set: { 'variants.0.stock': 20, totalStock: 20 } },
    );
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  async function freshSession() {
    const { accessToken, cookie } = await loginAsNewUser(app);
    const userId                  = parseAccessToken(accessToken).sub;
    const addressId               = await addAddressToUser(app, userId);
    return { accessToken, cookie, userId, addressId };
  }

  async function placeOrder(accessToken: string, addressId: string, qty = 1): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), variantId, quantity: qty });

    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ addressId });

    return res.body._id as string;
  }

  // ── Wallet balance ────────────────────────────────────────────────────────

  describe('GET /api/v1/payments/wallet', () => {
    it('new user starts with balance 0', async () => {
      const { accessToken } = await freshSession();
      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/wallet')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.balance).toBe(0);
    });

    it('no auth → 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/payments/wallet')
        .expect(401);
    });
  });

  // ── Wallet top-up via gateway ─────────────────────────────────────────────

  describe('POST /api/v1/payments/wallet/topup', () => {
    it('returns 200 with authority and gatewayUrl', async () => {
      const { accessToken } = await freshSession();
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/wallet/topup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 50_000 })
        .expect(200);

      expect(res.body.authority).toBeDefined();
      expect(typeof res.body.authority).toBe('string');
      expect(res.body.gatewayUrl).toBeDefined();
      expect(typeof res.body.gatewayUrl).toBe('string');
    });

    it('amount below minimum (10_000) → 400', async () => {
      const { accessToken } = await freshSession();
      await request(app.getHttpServer())
        .post('/api/v1/payments/wallet/topup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 5_000 })
        .expect(400);
    });

    it('no auth → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/wallet/topup')
        .send({ amount: 50_000 })
        .expect(401);
    });
  });

  // ── Pay order with WALLET method ──────────────────────────────────────────

  describe('POST /api/v1/payments/pay (WALLET method)', () => {
    it('sufficient wallet balance → 200 + success: true', async () => {
      const { accessToken, userId, addressId } = await freshSession();
      await creditWallet(app, userId, 200_000);

      const orderId = await placeOrder(accessToken, addressId, 1);

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId, method: 'wallet' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('order status becomes confirmed after wallet payment', async () => {
      const { accessToken, userId, addressId } = await freshSession();
      await creditWallet(app, userId, 200_000);

      const orderId = await placeOrder(accessToken, addressId, 1);
      await request(app.getHttpServer())
        .post('/api/v1/payments/pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId, method: 'wallet' });

      const orderRes = await request(app.getHttpServer())
        .get(`/api/v1/orders/my/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(orderRes.body.status).toBe('confirmed');
    });

    it('wallet balance is debited after payment', async () => {
      const { accessToken, userId, addressId } = await freshSession();
      await creditWallet(app, userId, 200_000);

      const orderId = await placeOrder(accessToken, addressId, 1); // cost: 50_000
      await request(app.getHttpServer())
        .post('/api/v1/payments/pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId, method: 'wallet' });

      const walletRes = await request(app.getHttpServer())
        .get('/api/v1/payments/wallet')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(walletRes.body.balance).toBe(150_000); // 200_000 - 50_000
    });

    it('insufficient wallet balance → 400', async () => {
      const { accessToken, userId, addressId } = await freshSession();
      await creditWallet(app, userId, 100); // way too low

      const orderId = await placeOrder(accessToken, addressId, 1);
      await request(app.getHttpServer())
        .post('/api/v1/payments/pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId, method: 'wallet' })
        .expect(400);
    });

    it('pay an already-confirmed order → 400 (idempotency)', async () => {
      const { accessToken, userId, addressId } = await freshSession();
      await creditWallet(app, userId, 500_000);

      const orderId = await placeOrder(accessToken, addressId, 1);

      // First payment succeeds
      await request(app.getHttpServer())
        .post('/api/v1/payments/pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId, method: 'wallet' })
        .expect(200);

      // Second attempt must fail (order is no longer PENDING)
      await request(app.getHttpServer())
        .post('/api/v1/payments/pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId, method: 'wallet' })
        .expect(400);
    });

    it('no auth → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/pay')
        .send({ orderId: '507f1f77bcf86cd799439011', method: 'wallet' })
        .expect(401);
    });
  });
});
