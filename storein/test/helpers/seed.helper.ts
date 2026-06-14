import { INestApplication } from '@nestjs/common';
import { getModelToken }    from '@nestjs/mongoose';
import { Model, Types }     from 'mongoose';
import { REDIS_CLIENT }     from 'src/redis/redis.module';

// ── Phone normalization (mirrors auth.service.ts) ──────────────────────────
export function normalizePhone(phone: string): string {
  if (phone.startsWith('+98')) return '0' + phone.slice(3);
  if (phone.startsWith('98'))  return '0' + phone.slice(2);
  return phone;
}

// ── OTP ──────────────────────────────────────────────────────────────────────

/** Reads the OTP stored in the ioredis-mock for the given phone. */
export async function getOtpFromRedis(
  app: INestApplication,
  phone: string,
): Promise<string> {
  const redis = app.get(REDIS_CLIENT);
  const key   = `otp:${normalizePhone(phone)}`;
  const otp   = await redis.get(key);
  if (!otp) throw new Error(`OTP not found for ${phone}. Did you call send-otp first?`);
  return otp as string;
}

// ── Category ──────────────────────────────────────────────────────────────────

export async function createTestCategory(
  app: INestApplication,
  overrides: Record<string, unknown> = {},
): Promise<any> {
  const model = app.get<Model<any>>(getModelToken('Category'));
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return model.create({
    name:      'دسته تست',
    slug:      `test-cat-${suffix}`,
    parent:    null,
    ancestors: [],
    depth:     0,
    isActive:  true,
    sortOrder: 0,
    ...overrides,
  });
}

// ── Product ───────────────────────────────────────────────────────────────────

/**
 * Creates a product with ONE active variant: price=100_000, stock=10.
 * The product is ACTIVE by default.
 */
export async function createTestProduct(
  app: INestApplication,
  categoryId: string,
  overrides: Record<string, unknown> = {},
): Promise<any> {
  const model     = app.get<Model<any>>(getModelToken('Product'));
  const variantId = new Types.ObjectId();
  const suffix    = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  return model.create({
    name:      'محصول تست',
    slug:      `test-product-${suffix}`,
    category:  new Types.ObjectId(categoryId),
    status:    'active',
    variants:  [{
      _id:          variantId,
      sku:          `SKU-${suffix}`,
      price:        100_000,
      comparePrice: null,
      stock:        10,
      isActive:     true,
      attributes:   [],
    }],
    minPrice:        100_000,
    maxPrice:        100_000,
    totalStock:      10,
    maxComparePrice: 0,
    images:          [],
    specs:           [],
    tags:            [],
    weight:          0,
    ...overrides,
  });
}

// ── User helpers ──────────────────────────────────────────────────────────────

/** Adds a complete shipping address to a user and returns the address _id. */
export async function addAddressToUser(
  app: INestApplication,
  userId: string,
): Promise<string> {
  const userModel = app.get<Model<any>>(getModelToken('User'));
  const addressId = new Types.ObjectId();
  await userModel.findByIdAndUpdate(userId, {
    $push: {
      addresses: {
        _id:            addressId,
        title:          'خانه',
        province:       'تهران',
        city:           'تهران',
        street:         'خیابان ولیعصر',
        detail:         'پلاک ۱',
        postalCode:     '1234567890',
        recipientName:  'کاربر تست',
        recipientPhone: '09121234567',
        isDefault:      true,
      },
    },
  });
  return addressId.toString();
}

// ── Wallet ────────────────────────────────────────────────────────────────────

/** Directly credits a user's wallet by setting balance (bypasses gateway). */
export async function creditWallet(
  app: INestApplication,
  userId: string,
  amount: number,
): Promise<void> {
  const walletModel = app.get<Model<any>>(getModelToken('Wallet'));
  await walletModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $set: { balance: amount, isActive: true } },
    { upsert: true, new: true },
  );
}
