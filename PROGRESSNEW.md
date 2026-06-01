# Storein — Backend Progress Log

Digikala-style e-commerce backend built with NestJS, MongoDB, and Redis.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 + TypeScript (strict mode) |
| Database | MongoDB 8.x via Mongoose |
| Cache / Queue | Redis via ioredis |
| Config | @nestjs/config + Joi validation |
| Testing | Jest 30 + ts-jest + mongodb-memory-server |
| Package manager | npm |

---

## Completed Tasks

### Task 1 — Project Bootstrap
- Scaffolded with `nest new storein --package-manager npm --strict --skip-git`
- TypeScript strict mode enabled (noImplicitAny, strictNullChecks, strictBindCallApply)

### Task 2 — Dependencies Installed

**Production**
```
@nestjs/mongoose  mongoose
@nestjs/config    joi
ioredis           @nestjs/cache-manager  cache-manager  cache-manager-ioredis-yet
bcryptjs          class-validator        class-transformer  @nestjs/mapped-types
```

**Dev**
```
mongodb-memory-server   @types/bcryptjs
```

### Task 3 — Folder Structure

```
src/
├── app.module.ts
├── main.ts
├── jest.setup.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   ├── pipes/
│   └── utils/
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   └── redis.config.ts
├── database/
│   ├── database.module.ts
│   └── database.module.spec.ts
├── redis/
│   ├── redis.module.ts
│   └── redis.module.spec.ts
└── modules/
    └── .gitkeep
```

### Task 4 — Environment Files

- `.env` — development defaults (MongoDB + Redis + JWT + OTP vars)
- `.env.test` — test environment overrides
- `.gitignore` — excludes `.env`, `node_modules/`, `dist/`, `coverage/`

Required env vars validated at startup via Joi schema:

```
NODE_ENV  PORT  MONGODB_URI
REDIS_HOST  REDIS_PORT
JWT_SECRET  JWT_EXPIRES_IN  JWT_REFRESH_SECRET  JWT_REFRESH_EXPIRES_IN
OTP_EXPIRES_IN  OTP_LENGTH
```

### Task 5 — Config Files

Namespaced config factories registered via `ConfigModule.forRoot`:

| File | Namespace | Keys |
|---|---|---|
| `app.config.ts` | `app` | nodeEnv, port, name |
| `database.config.ts` | `database` | uri |
| `redis.config.ts` | `redis` | host, port, ttl |

### Task 6 — DatabaseModule (`src/database/database.module.ts`)

- `MongooseModule.forRootAsync` using `ConfigService`
- Logs `✅ MongoDB connected` / `❌ MongoDB error` on connection events

### Task 7 — RedisModule (`src/redis/redis.module.ts`)

- Global module — inject `REDIS_CLIENT` token anywhere
- `ioredis` client with `lazyConnect: true` (no connection at boot unless used)
- Logs `✅ Redis connected` / `❌ Redis error`

### Task 8 — Common Utilities

**`AllExceptionsFilter`** — catches all exceptions, returns:
```json
{
  "success": false,
  "statusCode": 404,
  "timestamp": "2026-05-30T...",
  "path": "/api/v1/...",
  "message": "Not Found"
}
```

**`ResponseInterceptor`** — wraps every successful response:
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "timestamp": "2026-05-30T..."
}
```

### Task 9 — AppModule + main.ts

- `ConfigModule` global with Joi validation schema (fails fast on startup if vars missing)
- `DatabaseModule` and `RedisModule` imported at root
- Global prefix: `api/v1`
- `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Global filter (`AllExceptionsFilter`) and interceptor (`ResponseInterceptor`)
- CORS enabled

### Task 10 — Tests

| Suite | Result |
|---|---|
| `app.controller.spec.ts` | ✅ Pass |
| `database/database.module.spec.ts` | ✅ Pass |
| `redis/redis.module.spec.ts` | ✅ Pass |

`mongodb-memory-server` configured to use the local `mongod` binary at
`C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe` via `jest.setup.ts`.

```
Test Suites: 3 passed, 3 total
Tests:       3 passed, 3 total
Time:        ~4s
```

---

## API Response Contract

### Success
```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "timestamp": "ISO-8601"
}
```

### Error
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "path": "/api/v1/resource",
  "timestamp": "ISO-8601"
}
```

---

## Running Locally

```bash
# Install deps
npm install --no-audit

# Dev server
npm run start:dev   # → http://localhost:3000/api/v1

# Tests
npm run test
```

> **Note:** Use `--no-audit` with npm on this machine — the npm audit endpoint
> times out due to network restrictions.

---

## Phase 2 — Auth Module ✅

### Dependencies Added
```
@nestjs/jwt  @nestjs/passport  passport  passport-jwt  libphonenumber-js
@types/passport-jwt (dev)
```

### New Files
| File | Purpose |
|------|---------|
| `config/jwt.config.ts` | JWT namespace config |
| `config/otp.config.ts` | OTP namespace config |
| `modules/user/entities/user.schema.ts` | Minimal User schema |
| `modules/auth/entities/refresh-token.schema.ts` | RefreshToken schema + TTL index |
| `modules/auth/sms/sms.service.abstract.ts` | Abstract SMS provider |
| `modules/auth/sms/mock-sms.service.ts` | Dev mock — logs OTP to console |
| `modules/auth/strategies/jwt.strategy.ts` | Access token validation |
| `modules/auth/strategies/jwt-refresh.strategy.ts` | Refresh token validation |
| `modules/auth/guards/jwt-auth.guard.ts` | Supports `@Public()` bypass |
| `modules/auth/guards/jwt-refresh.guard.ts` | Protects refresh endpoint |
| `common/decorators/public.decorator.ts` | `@Public()` skip-auth decorator |
| `common/decorators/current-user.decorator.ts` | `@CurrentUser()` param decorator |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/v1/auth/send-otp` | Public | ارسال کد OTP |
| POST | `/api/v1/auth/verify-otp` | Public | تایید OTP، دریافت توکن |
| POST | `/api/v1/auth/refresh` | RefreshToken | تمدید توکن |
| POST | `/api/v1/auth/logout` | JWT | خروج از دستگاه جاری |
| POST | `/api/v1/auth/logout-all` | JWT | خروج از همه دستگاه‌ها |

### Key Decisions
- Phone normalized to `0912...` format (handles `+98`, `98`, `0` prefixes)
- OTP rate limit: max 3 per 10 min per phone (Redis counter + TTL)
- Refresh tokens stored in MongoDB with TTL auto-expire index
- `SmsService` is abstract → swap `MockSmsService` with Kavenegar/Twilio in production
- `JwtAuthGuard` is applied globally in future; `@Public()` marks open routes

### Tests
```
auth.service.spec.ts → 6 tests, all pass
```

---

## Phase 3 — User Module ✅

### Dependencies Added
```
@nestjs/mapped-types
```

### New Files
| File | Purpose |
|------|---------|
| `modules/user/user.module.ts` | User module |
| `modules/user/user.service.ts` | Profile + address + admin logic |
| `modules/user/user.controller.ts` | REST endpoints |
| `modules/user/entities/address.schema.ts` | Embedded address schema |
| `modules/user/dto/update-profile.dto.ts` | Profile update DTO |
| `modules/user/dto/create-address.dto.ts` | Address create DTO |
| `modules/user/dto/update-address.dto.ts` | Address update DTO (PartialType) |
| `common/guards/admin.guard.ts` | isAdmin check guard |

### Updated Files
| File | Change |
|------|--------|
| `modules/user/entities/user.schema.ts` | Added `addresses[]`, `fullName` virtual |
| `modules/auth/auth.module.ts` | Imports `UserModule` instead of registering `UserSchema` directly |
| `app.module.ts` | Added `UserModule` |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/users/me` | JWT | پروفایل کاربر جاری |
| PATCH | `/api/v1/users/me` | JWT | ویرایش پروفایل |
| POST | `/api/v1/users/me/addresses` | JWT | افزودن آدرس |
| PATCH | `/api/v1/users/me/addresses/:id` | JWT | ویرایش آدرس |
| DELETE | `/api/v1/users/me/addresses/:id` | JWT | حذف آدرس |
| PATCH | `/api/v1/users/me/addresses/:id/default` | JWT | آدرس پیش‌فرض |
| GET | `/api/v1/users` | JWT + Admin | لیست کاربران |
| GET | `/api/v1/users/:id` | JWT + Admin | جزئیات کاربر |
| PATCH | `/api/v1/users/:id/toggle-active` | JWT + Admin | فعال/غیرفعال |

### Key Decisions
- Addresses are embedded in User document (max 10)
- First address added → auto set as default
- Deleting default address → next address becomes default
- `UserModule` exports `MongooseModule` so `AuthModule` can consume `UserSchema`
- `AdminGuard` checks `user.isAdmin` injected by `JwtAuthGuard`

### Tests
```
user.service.spec.ts → 5 tests, all pass
Total: 15 tests, 5 suites, all pass
```

---

## Phase 4 — Category Module ✅

### Dependencies Added
```
slugify  (ships own types, no @types/* needed)
```

### New Files
| File | Purpose |
|------|---------|
| `modules/category/category.module.ts` | Category module |
| `modules/category/category.service.ts` | Tree logic + CRUD |
| `modules/category/category.controller.ts` | REST endpoints |
| `modules/category/entities/category.schema.ts` | Schema + indexes |
| `modules/category/dto/create-category.dto.ts` | Create DTO |
| `modules/category/dto/update-category.dto.ts` | Update DTO (PartialType) |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/categories/tree` | Public | درخت کامل دسته‌بندی |
| GET | `/api/v1/categories/roots` | Public | دسته‌های ریشه |
| GET | `/api/v1/categories/slug/:slug` | Public | دسته + فرزندان |
| GET | `/api/v1/categories/:id/subtree` | Public | همه زیرمجموعه‌ها |
| GET | `/api/v1/categories` | Admin | لیست همه (flat) |
| GET | `/api/v1/categories/:id` | Admin | جزئیات |
| POST | `/api/v1/categories` | Admin | ایجاد |
| PATCH | `/api/v1/categories/:id` | Admin | ویرایش |
| DELETE | `/api/v1/categories/:id` | Admin | حذف |

### Key Decisions
- `ancestors[]` array stores full path → getSubtree in O(1) with index
- `depth` field cached on each doc (no recursive query needed)
- Circular parent guard: prevents self-reference and subtree loops
- Delete blocked if category has children
- Slug auto-generated from name with duplicate suffix (-1, -2, ...)

### Tests
```
category.service.spec.ts → 7 tests, all pass
Total: 25 tests, 6 suites, all pass
```

---

## Phase 5 — Product Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/product/product.module.ts` | Product module |
| `modules/product/product.service.ts` | CRUD + variant + inventory logic |
| `modules/product/product.controller.ts` | REST endpoints |
| `modules/product/entities/product.schema.ts` | Product schema + indexes |
| `modules/product/entities/variant.schema.ts` | Embedded variant schema |
| `modules/product/dto/create-product.dto.ts` | Create DTO |
| `modules/product/dto/update-product.dto.ts` | Update DTO (PartialType) |
| `modules/product/dto/create-variant.dto.ts` | Variant DTO |
| `modules/product/dto/product-query.dto.ts` | List/filter query DTO |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/products` | Public | لیست محصولات فعال + فیلتر |
| GET | `/api/v1/products/slug/:slug` | Public | جزئیات محصول |
| GET | `/api/v1/products/admin` | Admin | لیست همه (admin) |
| GET | `/api/v1/products/admin/:id` | Admin | جزئیات admin |
| POST | `/api/v1/products` | Admin | ایجاد محصول |
| PATCH | `/api/v1/products/:id` | Admin | ویرایش محصول |
| DELETE | `/api/v1/products/:id` | Admin | حذف محصول |
| POST | `/api/v1/products/:id/variants` | Admin | افزودن ویریانت |
| PATCH | `/api/v1/products/:id/variants/:vid` | Admin | ویرایش ویریانت |
| DELETE | `/api/v1/products/:id/variants/:vid` | Admin | حذف ویریانت |
| PATCH | `/api/v1/products/:id/variants/:vid/stock` | Admin | تنظیم موجودی |

### Key Decisions
- Variants embedded in Product (sku, price, comparePrice, stock, attributes)
- `minPrice`, `maxPrice`, `totalStock` denormalized for fast filtering (no aggregation)
- `comparePrice` must use `type: Number` in `@Prop` — Mongoose can't infer union types
- Text index on name + description + tags for Phase 6 search
- `adjustStock(delta)` used by Order module in Phase 8 to decrement stock
- `viewCount` incremented on findBySlug (fire-and-forget)
- status: draft | active | inactive

### Tests
```
product.service.spec.ts → 6 tests, all pass
Total: 32 tests, 7 suites, all pass
```

---

## Phase 6 — Search & Filter Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/search/search.module.ts` | Search module |
| `modules/search/search.service.ts` | Search, suggest, history logic |
| `modules/search/search.controller.ts` | REST endpoints |
| `modules/search/dto/search-query.dto.ts` | Search + filter DTO |
| `modules/search/dto/search-suggest.dto.ts` | Autocomplete DTO |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/search?q=&category=&minPrice=&attrs=` | Public | جستجوی پیشرفته |
| GET | `/api/v1/search/suggest?q=` | Public | پیشنهاد اتوکامپلیت |
| GET | `/api/v1/search/history` | JWT | تاریخچه جستجو |
| DELETE | `/api/v1/search/history` | JWT | پاک کردن تاریخچه |
| DELETE | `/api/v1/search/history/:term` | JWT | حذف یک آیتم |

### Key Decisions
- MongoDB text index (Phase 5) powers full-text search
- Category filter fetches full subtree via `ancestors[]` (O(1) index)
- Facets built via aggregation pipeline: price range + attribute values
- `attrs` param format: `رنگ:مشکی,حافظه:128GB`
- Suggest results cached in Redis 5 min (TTL 300s)
- History stored as Redis list: dedup + max 10 items + 30-day TTL
- `saveHistory()` is fire-and-forget — never blocks search response

### Tests
```
search.service.spec.ts → 7 tests, all pass
Total: 41 tests, 8 suites, all pass
```

---

## Hotfix — TypeScript strict-mode errors + Mongoose index warning ✅

### TypeScript Errors Fixed (25 → 0)

| Pattern | Affected Files | Fix |
|---------|---------------|-----|
| `parseInt(process.env.X)` — `string \| undefined` | `app.config.ts`, `otp.config.ts`, `redis.config.ts` | Added `?? 'default'` fallback before parseInt |
| `app.listen(port)` — `number \| undefined` | `main.ts` | Added `?? 3000` fallback |
| `(err)` implicit `any` | `database.module.ts` | Annotated as `(err: Error)` |
| `secretOrKey \| expiresIn` — `string \| undefined` | `jwt.strategy.ts`, `jwt-refresh.strategy.ts`, `auth.module.ts`, `auth.service.ts` | Non-null assert `!` on secrets; cast `expiresIn` to `as any` (Joi guarantees values at startup; `StringValue` branded type is overly strict) |
| `TS1272` — decorated param types need explicit import | `auth.controller.ts`, `user.controller.ts`, `search.controller.ts` | Changed `import { UserDocument / Request }` → `import type { ... }` |
| `FilterQuery` — type-only export unusable with `isolatedModules` | `product.service.ts` | Replaced with `Record<string, any>` |
| `addresses: []` → inferred as `never[]` | `user.service.spec.ts` | Cast to `as any[]` |

### Mongoose Warning Fixed

Removed duplicate `schema.index({ slug: 1 }, { unique: true })` from:
- `modules/product/entities/product.schema.ts`
- `modules/category/entities/category.schema.ts`

The `unique: true` inside `@Prop()` already registers the index — the explicit `schema.index()` call was creating it a second time.

---

## Phase 7 — Cart Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/cart/cart.module.ts` | Cart module |
| `modules/cart/cart.service.ts` | Redis cart logic |
| `modules/cart/cart.controller.ts` | REST endpoints |
| `modules/cart/cart.interface.ts` | CartItem, Cart, CartSummary types |
| `modules/cart/dto/add-to-cart.dto.ts` | Add item DTO |
| `modules/cart/dto/update-cart-item.dto.ts` | Update item DTO |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/cart` | JWT | دریافت سبد + خلاصه |
| POST | `/api/v1/cart/items` | JWT | افزودن آیتم |
| PATCH | `/api/v1/cart/items/:productId` | JWT | ویرایش تعداد |
| DELETE | `/api/v1/cart/items/:productId/:variantId` | JWT | حذف آیتم |
| DELETE | `/api/v1/cart` | JWT | خالی کردن سبد |

### Key Decisions
- Cart stored in Redis key `cart:{userId}` — zero DB writes
- TTL: 7 days, reset on every write operation
- Price snapshot at add-time (price changes don't affect existing cart)
- Stock refreshed from DB on every getCart call (stale variants auto-removed)
- `quantity=0` on updateItem removes the item cleanly
- `getRawCart()` exported for OrderService (Phase 8)
- `savings = sum((comparePrice - price) * qty)` shown to user

### Tests
```
cart.service.spec.ts → 13 tests, all pass
Total: 54 tests, 9 suites, all pass
```

---

## Phase 8 — Order Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/order/order.module.ts` | Order module |
| `modules/order/order.service.ts` | Create, cancel, lifecycle logic |
| `modules/order/order.controller.ts` | REST endpoints |
| `modules/order/entities/order.schema.ts` | Schema + OrderStatus enum + transition map |
| `modules/order/dto/create-order.dto.ts` | Create order DTO |
| `modules/order/dto/update-order-status.dto.ts` | Status update DTO |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/v1/orders` | JWT | ثبت سفارش از سبد |
| GET | `/api/v1/orders/my` | JWT | لیست سفارش‌های من |
| GET | `/api/v1/orders/my/:id` | JWT | جزئیات سفارش |
| PATCH | `/api/v1/orders/my/:id/cancel` | JWT | لغو توسط کاربر |
| GET | `/api/v1/orders/admin` | Admin | لیست همه سفارش‌ها |
| GET | `/api/v1/orders/admin/:id` | Admin | جزئیات |
| PATCH | `/api/v1/orders/admin/:id/status` | Admin | تغییر وضعیت |

### Key Decisions
- `ORDER_TRANSITIONS` map enforces valid state machine jumps
- All item data + price frozen as snapshot at order time
- Shipping address copied from `user.addresses` (snapshot)
- Full stock validation pass before any write
- Stock decremented after order created; restored on cancel (user + admin)
- `orderNumber = ORD-{timestamp}-{rand4}` (unique + sortable)

### Order Lifecycle
```
pending → confirmed → processing → shipped → delivered
   ↓           ↓            ↓
cancelled  cancelled   cancelled
```

### Tests
```
order.service.spec.ts → 10 tests, all pass
Total: 64 tests, 10 suites, all pass
```

---

## Phase 9 — Payment Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/payment/payment.module.ts` | Payment module |
| `modules/payment/payment.service.ts` | Wallet + gateway + verify logic |
| `modules/payment/payment.controller.ts` | REST endpoints |
| `modules/payment/entities/wallet.schema.ts` | Wallet schema (per-user balance) |
| `modules/payment/entities/transaction.schema.ts` | Transaction audit log |
| `modules/payment/gateway/payment-gateway.abstract.ts` | Abstract gateway interface |
| `modules/payment/gateway/mock-payment-gateway.service.ts` | Dev mock (auto-success) |
| `modules/payment/dto/pay-order.dto.ts` | Pay order DTO |
| `modules/payment/dto/topup-wallet.dto.ts` | Wallet top-up DTO |
| `modules/payment/dto/verify-payment.dto.ts` | Gateway verify DTO |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/payments/wallet` | JWT | موجودی کیف پول |
| GET | `/api/v1/payments/transactions` | JWT | تاریخچه تراکنش‌ها |
| POST | `/api/v1/payments/wallet/topup` | JWT | شارژ کیف پول |
| POST | `/api/v1/payments/pay` | JWT | پرداخت سفارش |
| GET | `/api/v1/payments/verify` | Public | تایید درگاه (callback) |

### Payment Methods
| Method | Flow |
|--------|------|
| `wallet` | Check balance → debit → confirm order |
| `gateway` | Create pending tx → return gateway URL → verify callback |
| `mixed` | Check wallet → create gateway tx → on verify: debit wallet + confirm |

### Key Decisions
- `PaymentGateway` is abstract → swap `MockPaymentGateway` with ZarinPal/IDPay
- Wallet balance uses atomic `$inc` + `$gte` guard (prevents negative balance race)
- All financial amounts stored as integer (تومان) — never float
- `getOrCreateWallet` uses upsert — no wallet migration needed
- `verifyPayment` endpoint is `@Public()` — called by gateway redirect
- Transaction audit trail: every debit/credit creates a TX record
- Top-up flow: pending TX → gateway → verify → credit wallet
- `getOrCreateWallet` avoids `.lean()` chaining for mock-compatible interface

### Tests
```
payment.service.spec.ts → 13 tests, all pass
Total: 77 tests, 11 suites, all pass
```

---

## Phase 10 — Review & Rating Module ✅

### Updated Files
| File | Change |
|------|--------|
| `modules/product/entities/product.schema.ts` | Added `avgRating`, `reviewCount` fields |

### New Files
| File | Purpose |
|------|---------|
| `modules/review/review.module.ts` | Review module |
| `modules/review/review.service.ts` | Create, list, helpful, admin, rating recalc |
| `modules/review/review.controller.ts` | REST endpoints |
| `modules/review/entities/review.schema.ts` | Review schema + unique index |
| `modules/review/dto/create-review.dto.ts` | Create DTO |
| `modules/review/dto/update-review-status.dto.ts` | Admin status DTO |
| `modules/review/dto/review-query.dto.ts` | Query/filter DTO |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/reviews?productId=` | Public | نظرات محصول + آمار |
| POST | `/api/v1/reviews` | JWT | ثبت نظر (خریداران) |
| GET | `/api/v1/reviews/my` | JWT | نظرات من |
| POST | `/api/v1/reviews/:id/helpful` | JWT | مفید بود / نبود |
| GET | `/api/v1/reviews/admin` | Admin | همه نظرات |
| PATCH | `/api/v1/reviews/admin/:id/status` | Admin | تایید / رد |
| DELETE | `/api/v1/reviews/admin/:id` | Admin | حذف |

### Key Decisions
- Only verified purchasers can review (orderId verified against DB)
- Unique index `userId + productId` prevents duplicate reviews
- Reviews require admin approval before showing publicly
- `avgRating` + `reviewCount` recalculated on approve/delete via aggregation
- Helpful votes stored in Redis Set (dedup per user, 90-day TTL)
- Rating distribution (1–5 stars) calculated on-demand in getProductReviews

### Tests
```
review.service.spec.ts → 11 tests, all pass
Total: 88 tests, 12 suites, all pass
```

---

## Phase 11 — Wishlist + Compare Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/wishlist/wishlist.module.ts` | Combined wishlist + compare module |
| `modules/wishlist/wishlist.service.ts` | All wishlist + compare logic |
| `modules/wishlist/wishlist.controller.ts` | Wishlist endpoints |
| `modules/wishlist/compare.controller.ts` | Compare endpoints |
| `modules/wishlist/entities/wishlist.schema.ts` | Wishlist schema |

### Wishlist Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/wishlist` | JWT | لیست علاقه‌مندی‌ها |
| POST | `/api/v1/wishlist/:productId` | JWT | افزودن/حذف toggle |
| GET | `/api/v1/wishlist/:productId/check` | JWT | بررسی وجود محصول |
| DELETE | `/api/v1/wishlist` | JWT | پاک کردن کامل |

### Compare Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/compare` | JWT | مقایسه + اتحاد specKeys |
| POST | `/api/v1/compare/:productId` | JWT | افزودن به مقایسه |
| DELETE | `/api/v1/compare/:productId` | JWT | حذف از مقایسه |
| DELETE | `/api/v1/compare` | JWT | پاک کردن مقایسه |

### Key Decisions
- Wishlist: MongoDB — persistent, paginated, order preserved
- `toggle()` uses `$pull` + `$addToSet` (atomic, idempotent)
- Wishlist pagination: slice productIds array, then fetch product details
- Compare: Redis JSON (key: `compare:{userId}`, TTL: 24h)
- Max 4 products in compare — returns `BadRequestException` when full
- `getCompare` returns `specKeys[]` = union of all products' spec keys (for table headers)
- Both controllers share one service — no circular dependency
- `exists()` called without `.lean()` chaining (mock-compatible)

### Tests
```
wishlist.service.spec.ts → 15 tests, all pass
Total: 103 tests, 13 suites, all pass
```

---

## Phase 12 — Discount & Coupon Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/discount/discount.module.ts` | Discount module |
| `modules/discount/discount.service.ts` | Validate, recordUsage, admin CRUD |
| `modules/discount/discount.controller.ts` | REST endpoints |
| `modules/discount/entities/coupon.schema.ts` | Coupon schema |
| `modules/discount/entities/coupon-usage.schema.ts` | Usage audit log |
| `modules/discount/dto/create-coupon.dto.ts` | Create DTO |
| `modules/discount/dto/update-coupon.dto.ts` | Update DTO |
| `modules/discount/dto/validate-coupon.dto.ts` | Validate DTO |

### Updated Files
| File | Change |
|------|--------|
| `modules/order/entities/order.schema.ts` | Added `couponCode` field |
| `modules/order/dto/create-order.dto.ts` | Added optional `couponCode` |
| `modules/order/order.module.ts` | Added `DiscountModule` import |
| `modules/order/order.service.ts` | Coupon validate + recordUsage in createFromCart |
| `modules/order/order.service.spec.ts` | Added DiscountService mock |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/v1/discounts/validate` | JWT | اعتبارسنجی کد تخفیف |
| POST | `/api/v1/discounts` | Admin | ایجاد کوپن |
| GET | `/api/v1/discounts` | Admin | لیست کوپن‌ها |
| GET | `/api/v1/discounts/:id` | Admin | جزئیات |
| PATCH | `/api/v1/discounts/:id` | Admin | ویرایش |
| PATCH | `/api/v1/discounts/:id/deactivate` | Admin | غیرفعال‌سازی |
| GET | `/api/v1/discounts/:id/usages` | Admin | گزارش استفاده |

### Key Decisions
- `validate()` is read-only — no side effects (safe to call before checkout)
- `recordUsage()` called after order successfully created (not before)
- Percentage discount capped by `maxDiscountAmount` (e.g. max 500K تومان)
- Fixed discount capped at cart total (can't produce negative total)
- Soft-deactivate only — no hard delete (audit trail preserved)
- `perUserLimit` default 1 (single-use per user)

### Discount Types
| Type | Example | Behavior |
|------|---------|----------|
| `percentage` | 20% off | `cartTotal * 0.2`, capped at `maxDiscountAmount` |
| `fixed` | 50,000 تومان | Flat amount, capped at `cartTotal` |

### Tests
```
discount.service.spec.ts → 16 tests, all pass
Total: 119 tests, 14 suites, all pass
```

---

## Hotfix — OrderModule missing MongooseModule export ✅

### Problem
`ReviewService` injects `@InjectModel(Order.name)` and `ReviewModule` imports `OrderModule`.
At runtime NestJS threw `UnknownDependenciesException` for `OrderModel` at index [2] because
`OrderModule` only exported `OrderService`, not the underlying `MongooseModule`.

### Fix
**`modules/order/order.module.ts`** — added `MongooseModule` to `exports`:
```typescript
exports: [OrderService, MongooseModule],
```

This mirrors the pattern already used by `ProductModule` and `UserModule`.

---

## Phase 13 — Notification Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/notification/notification.module.ts` | Notification module |
| `modules/notification/notification.service.ts` | Create, inbox, markRead, broadcast |
| `modules/notification/notification.controller.ts` | REST endpoints |
| `modules/notification/notification.listener.ts` | EventEmitter event handlers |
| `modules/notification/entities/notification.schema.ts` | Notification schema |
| `modules/notification/channels/notification-channel.abstract.ts` | Abstract SMS + Push |
| `modules/notification/channels/mock-sms.channel.ts` | Dev SMS mock |
| `modules/notification/channels/mock-push.channel.ts` | Dev Push mock |
| `modules/notification/dto/admin-broadcast.dto.ts` | Broadcast DTO |
| `modules/notification/dto/notification-query.dto.ts` | Query DTO |

### Updated Files
| File | Change |
|------|--------|
| `app.module.ts` | Added EventEmitterModule + NotificationModule |
| `modules/order/order.service.ts` | Emits `order.status.changed` after updateStatus/cancel |
| `modules/order/order.service.spec.ts` | Added EventEmitter2 mock |
| `modules/payment/payment.service.ts` | Emits `payment.success` / `payment.failed` after verify |
| `modules/payment/payment.service.spec.ts` | Added EventEmitter2 mock + walletModel.db chain |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/notifications` | JWT | اعلان‌های من |
| GET | `/api/v1/notifications/unread-count` | JWT | تعداد خوانده‌نشده |
| PATCH | `/api/v1/notifications/:id/read` | JWT | علامت خوانده‌شده |
| PATCH | `/api/v1/notifications/read-all` | JWT | همه خوانده‌شده |
| POST | `/api/v1/notifications/admin/broadcast` | Admin | ارسال به همه / یک کاربر |
| DELETE | `/api/v1/notifications/admin/:id` | Admin | حذف اعلان |

### Event Flow
```
OrderService.updateStatus() / cancelMyOrder()
  → eventEmitter.emit('order.status.changed', {...})
    → NotificationListener.handleOrderStatusChanged()
      → NotificationService.create() → DB + SMS (fire-and-forget) + Push

PaymentService.verifyPayment()
  → eventEmitter.emit('payment.success' | 'payment.failed', {...})
    → NotificationListener.handle...()
      → NotificationService.create()
```

### Key Decisions
- EventEmitter decouples producers (Order/Payment) from consumer (Notification)
- OrderService does NOT import NotificationModule — no circular dependency risk
- SMS + Push are fire-and-forget (errors logged, never throw to caller)
- `SmsNotificationChannel` + `PushNotificationChannel` are abstract — swap in prod
- Broadcast uses `insertMany` (bulk insert, efficient for large user bases)
- `readAt: Date | null` requires explicit `@Prop({ type: Date })` — Mongoose can't infer union types
- `@nestjs/event-emitter` registered globally in AppModule

### Tests
```
notification.service.spec.ts → 10 tests, all pass
Total: 129 tests, 15 suites, all pass
```

---

## Phase 14 — Admin Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/admin/admin.module.ts` | Admin module (direct schema injection) |
| `modules/admin/admin.service.ts` | Dashboard, revenue, inventory, user mgmt, health |
| `modules/admin/admin.controller.ts` | REST endpoints (all behind AdminGuard) |
| `modules/admin/dto/date-range.dto.ts` | DateRangeDto + LowStockDto |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/admin/dashboard` | Admin | KPI overview (cached 5min) |
| GET | `/api/v1/admin/stats/revenue?from=&to=` | Admin | درآمد روزانه |
| GET | `/api/v1/admin/stats/orders` | Admin | آمار سفارش‌ها |
| GET | `/api/v1/admin/stats/recent-orders` | Admin | سفارش‌های اخیر |
| GET | `/api/v1/admin/products/low-stock?threshold=` | Admin | موجودی پایین |
| GET | `/api/v1/admin/products/top-selling` | Admin | پرفروش‌ترین محصولات |
| GET | `/api/v1/admin/users/admins` | Admin | لیست ادمین‌ها |
| PATCH | `/api/v1/admin/users/:id/promote` | Admin | ارتقا به ادمین |
| PATCH | `/api/v1/admin/users/:id/demote` | Admin | لغو دسترسی ادمین |
| POST | `/api/v1/admin/cache/clear` | Admin | پاک‌سازی کش آمار |
| GET | `/api/v1/admin/cache/info` | Admin | اطلاعات کش |
| GET | `/api/v1/admin/health` | Public | بررسی سلامت سرویس |

### Key Decisions
- AdminModule imports schemas directly (no feature-module imports → no circular deps)
- Dashboard cached in Redis 5 min (key: `admin:dashboard`)
- Revenue cached per date-range (key: `admin:revenue:{from}:{to}`)
- `clearCache` deletes all `admin:*` Redis keys atomically
- Health check tests MongoDB ping + Redis ping; never throws
- `/admin/health` is `@Public()` for external monitoring (uptime robots, k8s probes)
- Low-stock threshold defaults to 10 (configurable via query param)

### Dashboard Response Structure
```json
{
  "users":    { "total", "active", "newThisMonth" },
  "orders":   { "pending", "confirmed", "delivered", "cancelled", "total" },
  "revenue":  { "allTime", "thisMonth", "today" },
  "products": { "total", "active", "lowStock" },
  "generatedAt": "ISO-8601"
}
```

### Tests
```
admin.service.spec.ts → 13 tests, all pass
Total: 142 tests, 16 suites, all pass
```

---

## Phase 15 — Upload Module ✅

### New Files
| File | Purpose |
|------|---------|
| `modules/upload/upload.module.ts` | Upload module |
| `modules/upload/upload.service.ts` | Validate, process (sharp), save |
| `modules/upload/upload.controller.ts` | REST endpoints |
| `modules/upload/storage/storage-provider.abstract.ts` | Abstract storage interface |
| `modules/upload/storage/local-storage.provider.ts` | Dev local file system provider |
| `config/upload.config.ts` | Upload namespace config |

### Updated Files
| File | Change |
|------|--------|
| `.env` + `.env.test` | Added UPLOAD_DEST, UPLOAD_MAX_FILE_SIZE, UPLOAD_BASE_URL |
| `app.module.ts` | Added uploadConfig, UploadModule, Joi validation |
| `main.ts` | NestExpressApplication + static file serving at `/uploads` |

### Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/v1/upload/image?folder=` | JWT | آپلود یک تصویر |
| POST | `/api/v1/upload/images?folder=` | JWT | آپلود چند تصویر (max 10) |
| DELETE | `/api/v1/upload/:key` | Admin | حذف فایل |

### Folder Values
| Value | Usage |
|-------|-------|
| `products` | تصاویر محصولات |
| `avatars` | آواتار کاربران |
| `reviews` | تصاویر نظرات |
| `categories` | آیکون/تصویر دسته‌بندی |

### Upload Response
```json
{
  "original":  { "key": "products/uuid.webp",       "url": "http://.../uploads/products/uuid.webp" },
  "thumbnail": { "key": "products/uuid_thumb.webp",  "url": "http://.../uploads/products/uuid_thumb.webp" }
}
```

### Key Decisions
- `StorageProvider` is abstract → swap `LocalStorageProvider` with `S3StorageProvider` in prod
- All images converted to WebP (85% quality original, 75% thumbnail) for bandwidth savings
- Originals resized to max 1920×1920 (aspect ratio preserved, no upscaling)
- Thumbnails: 300×300 cover crop
- `crypto.randomUUID()` used instead of uuid package (uuid v11 is ESM-only, breaks Jest)
- Memory storage for Multer — buffer passed directly to sharp (no temp files)
- `deleteFile` also attempts to delete thumbnail (silent fail if not exists)
- Static serving at `/uploads/**` — only in dev; in prod, CDN serves directly
- Sharp mock needs `__esModule: true` so `__importStar` returns the callable function directly

### Tests
```
upload.service.spec.ts → 10 tests, all pass
Total: 152 tests, 17 suites, all pass
```

---

## Backend Complete — All 15 Phases Done

### Full Module Summary
| Phase | Module | Tests |
|-------|--------|-------|
| 1 | Project Init + Config + DB + Redis | 3 |
| 2 | Auth (OTP + JWT) | 7 |
| 3 | User (Profile + Addresses) | 5 |
| 4 | Category (Tree) | 7 |
| 5 | Product (Variants + Inventory) | 6 |
| 6 | Search & Filter (Facets + History) | 7 |
| 7 | Cart (Redis) | 9 |
| 8 | Order (Lifecycle + Transitions) | 10 |
| 9 | Payment (Wallet + Gateway) | 13 |
| 10 | Review & Rating | 11 |
| 11 | Wishlist + Compare | 15 |
| 12 | Discount & Coupon | 16 |
| 13 | Notification (EventEmitter) | 10 |
| 14 | Admin Dashboard | 13 |
| 15 | Upload (CDN-ready) | 10 |
| **Total** | **15 modules** | **152 tests** |

**API Endpoint Count:** ~120 endpoints
**Stack:** NestJS 11 + MongoDB + Redis + Sharp + EventEmitter

---

## Frontend — Vue 3 (storein-front)

### Stack
| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build | Vite |
| State | Pinia |
| Styling | Tailwind CSS + PostCSS |
| HTTP | Axios |
| Utils | dayjs, @vueuse/core |

### Views Implemented (stub — content filled in Phase 3)
| View | Route | Name | Auth | Description |
|------|-------|------|------|-------------|
| `HomeView` | `/` | `home` | Public | صفحه اصلی |
| `ProductListView` | `/products` | `products` | Public | لیست محصولات + فیلتر |
| `ProductListView` | `/category/:slug` | `category` | Public | محصولات یک دسته |
| `SearchView` | `/search` | `search` | Public | نتایج جستجو |
| `ProductDetailView` | `/product/:slug` | `product-detail` | Public | جزئیات محصول |
| `LoginView` | `/auth/login` | `login` | Guest | ورود با شماره موبایل |
| `OtpView` | `/auth/otp` | `otp` | Guest | تایید کد OTP |
| `CartView` | `/cart` | `cart` | Public | سبد خرید |
| `CheckoutView` | `/checkout` | `checkout` | JWT | تکمیل سفارش |
| `ProfileView` | `/user/profile` | `user-profile` | JWT | پروفایل کاربر |
| `OrdersView` | `/user/orders` | `user-orders` | JWT | لیست سفارش‌ها |
| `OrderDetailView` | `/user/orders/:id` | `user-order-detail` | JWT | جزئیات سفارش |
| `FavoritesView` | `/user/favorites` | `user-favorites` | JWT | علاقه‌مندی‌ها |
| `AddressesView` | `/user/addresses` | `user-addresses` | JWT | مدیریت آدرس‌ها |
| `NotFoundView` | `/:pathMatch(.*)` | `not-found` | Public | صفحه 404 |

### Stores Implemented
| Store | Responsibility |
|-------|---------------|
| `auth` | Phone OTP login, profile fetch, logout, token persistence |
| `product` | Product listing with pagination (24/page), filters (price, attributes, brand, sort) |
| `cart` | Add/update/remove items, cart totals |
| `category` | Category tree |
| `ui` | Global UI state (modals, loading, etc.) |

### Services
`http`, `auth`, `product`, `category`, `cart`, `user` — all backed by Axios with JWT header injection.

### Status
| Feature | Phase 1 | Phase 2 | Phase 3 | Phase 4+ |
|---------|---------|---------|---------|----------|
| Project setup (stores, services, router) | ✅ | — | — | — |
| Base components (Button, Input, Modal…) | — | ✅ | — | — |
| App layout (Header, Footer, MobileNav) | — | ✅ | — | — |
| Font: IRANYekan | — | — | ✅ | — |
| Wishlist service + store | — | — | ✅ | — |
| Home page (all 8 sections) | stub | — | ✅ | — |
| OTP login / register flow | stub | — | — | 🔲 |
| Product listing + filter sidebar | stub | — | — | 🔲 |
| Product detail page | stub | — | — | 🔲 |
| Search results | stub | — | — | 🔲 |
| Shopping cart | stub | — | — | 🔲 |
| Checkout + address select | stub | — | — | 🔲 |
| User profile / edit | stub | — | — | 🔲 |
| Order history + detail | stub | — | — | 🔲 |
| Favorites / Wishlist view | stub | — | — | 🔲 |
| Address management | stub | — | — | 🔲 |
| Payment integration (wallet + gateway) | — | — | — | 🔲 |

---

## Frontend Phase 3 — Home Page + Wishlist ✅

### Font: Vazirmatn → IRANYekan

| File | Change |
|------|--------|
| `src/assets/styles/fonts.css` | Replaced Vazirmatn `@font-face` blocks with IRANYekan (4 weights: 400/500/700/900). CDN `@import` alternative documented in comments. Local files go in `src/assets/fonts/`. |
| `src/assets/styles/variables.css` | `--font-family: 'IRANYekan', 'Tahoma', system-ui, sans-serif` |
| `tailwind.config.js` | `fontFamily: { sans: ['IRANYekan', 'Tahoma', 'system-ui', 'sans-serif'] }` |

### New Files
| File | Purpose |
|------|---------|
| `src/services/wishlist.service.js` | `getAll`, `toggle`, `check`, `clear` — maps to `/wishlist` endpoints |
| `src/stores/wishlist.store.js` | `wishlistIds` Set for O(1) lookup; optimistic `toggle()` with rollback; login guard with toast |
| `src/views/home/components/HeroBanner.vue` | 3-slide auto-play (4.5s), fade transition, dot nav + desktop arrows, per-slide decorative glasses SVG |
| `src/views/home/components/CategoryBar.vue` | 7 horizontally-scrollable category pills — colored circles + inline SVG icons |
| `src/views/home/components/FlashSale.vue` | Dark-blue gradient section, live countdown to midnight, products from `sortBy=discount`, skeleton loading |
| `src/views/home/components/ProductRow.vue` | Reusable horizontal product row: RTL-aware scroll arrows, skeleton, empty state |
| `src/views/home/components/SpecialBanner.vue` | Two side-by-side gradient promo banners with decorative glasses SVG outlines |
| `src/views/home/components/TrustStrip.vue` | 4 trust badges in 2×2 grid (mobile) / 4-column (desktop) |

### Updated Files
| File | Change |
|------|--------|
| `src/views/home/HomeView.vue` | Full 8-section implementation: Hero → CategoryBar → FlashSale → New Arrivals → SpecialBanner → Bestsellers → Sunglasses Row → TrustStrip |

### HomeView Layout
```
① HeroBanner     — full-width slider, outside container padding
② CategoryBar    — 7 eyewear category quick links
③ FlashSale      — countdown + discounted products horizontal scroll
④ ProductRow     — "جدیدترین عینک‌ها" (sortBy=newest)
⑤ SpecialBanner  — 2-up promotional cards
⑥ ProductRow     — "پرفروش‌ترین‌ها" (sortBy=bestseller)
⑦ ProductRow     — "عینک‌های آفتابی" (category=sunglasses)
⑧ TrustStrip     — 4 trust guarantees
```

### Key Decisions
- `wishlistStore.wishlistIds` is a `Set<string>` — `isInWishlist()` runs O(1) vs linear scan
- Optimistic wishlist toggle updates UI instantly and rolls back on API failure
- `fetchWishlist()` is a no-op when user is not logged in (safe to call unconditionally in `onMounted`)
- All 3 product row sections + wishlist fetched with `Promise.allSettled` in parallel — page load is bounded by the slowest call, not their sum
- `ProductRow` uses `Math.abs(el.scrollLeft)` for RTL scroll detection (Chrome gives negative scrollLeft in RTL, Firefox gives positive)
- `FlashSale` countdown recomputes `endOfDay()` each tick to avoid midnight edge case
- `HeroBanner` auto-timer resets on manual dot navigation to avoid immediate skip
- Font files are loaded from `src/assets/fonts/` — Tahoma fallback ensures readable Persian text even before woff2 files are present

### Build
```
145 modules, 0 errors
(4 font path warnings — expected until woff2 files are placed in src/assets/fonts/)
```

---

## Frontend Phase 2 — Base Components + Layout ✅

### Updated Files
| File | Change |
|------|--------|
| `src/services/http.service.js` | Added response envelope unwrapper: `{ success, data }` → `data` |
| `src/services/category.service.js` | Added `getTree()` → `/categories/tree` |
| `src/stores/category.store.js` | Updated `fetchCategories()` to use `getTree()` with safe Array check |
| `src/layouts/DefaultLayout.vue` | Full layout: Header + Footer + MobileNav + Toast |
| `src/layouts/AuthLayout.vue` | Minimal layout: centered logo + Toast |

### New Base Components (`src/components/common/`)
| Component | Description |
|-----------|-------------|
| `BaseSpinner.vue` | CSS border spinner, 3 sizes (sm/md/lg), 3 colors (brand/white/gray) |
| `BaseSkeleton.vue` | Pulse skeleton, configurable width/height, circle mode, multi-row |
| `BaseBadge.vue` | 6 color variants (red/green/yellow/blue/navy/gray), dot indicator |
| `BaseButton.vue` | 4 variants × 3 sizes, loading spinner, block/disabled states |
| `BaseInput.vue` | Full v-model, label, error, hint, prepend/append slots, dir prop |
| `BaseModal.vue` | Teleport to body, backdrop, ESC close, scroll lock, fade+scale transition |
| `BaseToast.vue` | TransitionGroup container, reads from `useUiStore().toasts` |
| `BaseEmpty.vue` | Empty state: icon, title, subtitle, optional action button |
| `BaseRating.vue` | 5 SVG stars, readonly/interactive, count display, 3 sizes |
| `BaseProductCard.vue` | Full product card: image, wishlist heart, discount badge, rating, price, cart button; skeleton variant |

### New Layout Components (`src/components/layout/`)
| Component | Description |
|-----------|-------------|
| `AppHeader.vue` | Sticky header; desktop: logo + search + actions + category nav; mobile: hamburger + logo + search row |
| `AppHeaderSearch.vue` | Debounced search (300ms), suggest dropdown with products + categories sections, `onClickOutside` close |
| `AppHeaderActions.vue` | User dropdown (avatar + menu), cart badge, notification bell with unread count |
| `AppHeaderNav.vue` | Category nav (desktop), fixed quick links + dynamic categories, mega-dropdown on hover |
| `AppMobileNav.vue` | Fixed bottom nav (mobile), 5 items with active state detection, cart count badge |
| `AppFooter.vue` | 3-column footer: brand/social, categories, quick links + contact; trust badges row; copyright |

### Key Decisions
- Response envelope unwrapped in `http.service.js` interceptor — all stores now receive `data` directly (not `{ success, data }`)
- `categoryService.getTree()` added; category store switched from flat `/categories` (admin) to `/categories/tree` (public)
- Inline SVG icons — no icon library dependency in this phase
- `@vueuse/core` `onClickOutside` + `useDebounceFn` used in AppHeaderSearch and AppHeaderActions
- `BaseProductCard` uses `imgSrc` ref with `@error` handler for broken image fallback to `PRODUCT_PLACEHOLDER`
- AppMobileNav active state detected via `route.name` against `routeNames` array per item
- Build: **126 modules**, 0 errors (2 `#__PURE__` annotation warnings from `@vueuse/core` internals — benign)

---

## Frontend Phase 4+ — Remaining Views (Planned)

All view files exist as stubs. Phase 4+ fills each with real data fetching + UI using the base components.

### Priority Order
| # | View | Key components used | Backend endpoints |
|---|------|---------------------|-------------------|
| 1 | `LoginView` + `OtpView` | `BaseInput`, `BaseButton`, `BaseSpinner` | `POST /auth/send-otp`, `POST /auth/verify-otp` |
| 2 | `ProductListView` | `BaseProductCard`, `BaseEmpty`, filter sidebar | `GET /products`, `GET /categories/tree` |
| 3 | `ProductDetailView` | `BaseRating`, `BaseButton`, image gallery | `GET /products/slug/:slug`, `GET /reviews?productId=` |
| 4 | `SearchView` | `BaseProductCard`, `BaseEmpty` | `GET /search?q=` |
| 5 | `CartView` | `BaseButton`, quantity stepper | `GET /cart`, `PATCH /cart/items/:id` |
| 6 | `CheckoutView` | `BaseModal`, `BaseButton`, address select | `POST /orders`, `POST /payments/pay` |
| 7 | `ProfileView` | `BaseInput`, `BaseButton` | `GET /users/me`, `PATCH /users/me` |
| 8 | `OrdersView` + `OrderDetailView` | `BaseBadge`, `BaseEmpty` | `GET /orders/my`, `GET /orders/my/:id` |
| 9 | `FavoritesView` | `BaseProductCard`, `BaseEmpty` | `GET /wishlist` |
| 10 | `AddressesView` | `BaseModal`, `BaseInput`, `BaseButton` | `GET /users/me/addresses`, `POST /users/me/addresses` |

### Shared Patterns
- Data fetching: `onMounted` + store action or direct service call
- Loading state: `BaseProductCard :loading="true"` grid while fetching, `BaseSkeleton` for other content
- Empty state: `BaseEmpty` with contextual icon + message
- Error state: `useUiStore().addToast(message, 'error')` on API failure
- Auth guards: already wired in router — no per-view redirect needed
