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
| Font: IRANYekan → IRANSans | — | — | ✅ | ✅ (hotfix) |
| Wishlist service + store | — | — | ✅ | — |
| Home page (all 8 sections) | stub | — | ✅ | — |
| OTP login / register flow | stub | — | — | ✅ |
| Product listing + filter sidebar | stub | — | — | ✅ |
| Product detail page | stub | — | — | ✅ |
| Search results | stub | — | — | ✅ |
| Shopping cart | stub | — | — | 🔲 |
| Checkout + address select | stub | — | — | 🔲 |
| User profile / edit | stub | — | — | 🔲 |
| Order history + detail | stub | — | — | 🔲 |
| Favorites / Wishlist view | stub | — | — | 🔲 |
| Address management | stub | — | — | 🔲 |
| Payment integration (wallet + gateway) | — | — | — | 🔲 |

---

## Frontend Phase 6 — Product Detail Page ✅

### New Files
| File | Purpose |
|------|---------|
| `src/services/review.service.js` | `getByProduct`, `create`, `markHelpful`, `getMyReviews` — maps to `/reviews` endpoints |
| `src/views/product-detail/components/ProductGallery.vue` | Main image + desktop thumbnails + mobile dot indicators + touch swipe (RTL-aware) + fade transition; exposes `setImage(idx)` |
| `src/views/product-detail/components/ProductInfo.vue` | Name, rating, color swatches, price/discount badge, stock indicator, cart + wishlist buttons, guarantees strip; exposes `cartButtonRef` for sticky bar |
| `src/views/product-detail/components/ProductSpecs.vue` | General specs table + dynamic variant attributes + full color-variants availability table |
| `src/views/product-detail/components/ProductTabs.vue` | 3-tab bar (مشخصات / توضیحات / نظرات) with review count badge and `out-in` fade transition between tabs |
| `src/views/product-detail/components/ReviewCard.vue` | Avatar initials, rating stars, title, comment, review images strip, helpful toggle button |
| `src/views/product-detail/components/ReviewForm.vue` | Collapsible accordion; star selector, title + comment inputs, 403 purchase-guard error, submit with validation |
| `src/views/product-detail/components/ProductReviews.vue` | Rating distribution bars, sort select, paginated list (load-more), integrates `ReviewForm` + `ReviewCard` |
| `src/views/product-detail/components/RelatedProducts.vue` | Horizontal scroll row — same category, excludes current product, skeleton state |

### Updated Files
| File | Change |
|------|--------|
| `src/views/product-detail/ProductDetailView.vue` | Full implementation replacing stub: breadcrumb, 404 state, 2-col desktop grid (Gallery + Info), ProductTabs, RelatedProducts, mobile sticky bottom bar |
| `src/utils/formatters.js` | Added `formatDate(iso)` — Persian locale via `Intl.DateTimeFormat('fa-IR')` |

### Endpoints Used
| Endpoint | Where |
|----------|-------|
| `GET /products/slug/:slug` | `ProductDetailView` on mount + slug watch |
| `GET /reviews?productId=&page=&limit=&sortBy=` | `ProductReviews` on mount + sort change + load-more |
| `POST /reviews` | `ReviewForm.submitReview()` |
| `POST /reviews/:id/helpful` | `ProductReviews.markHelpful()` |
| `GET /products?category=&limit=8&status=active` | `RelatedProducts` on mount |
| `POST /cart/items` | `ProductInfo.handleAddToCart()` + sticky bar `quickAddToCart()` |
| `POST /wishlist/:productId` | `ProductInfo.handleWishlist()` via `wishlistStore.toggle()` |

### Key Decisions
- Gallery touch swipe is RTL-aware: swipe right → `prev()`, swipe left → `next()` (opposite of LTR); threshold 50px to ignore accidental taps
- `ProductInfo` exposes `cartButtonRef` via `defineExpose` → parent uses `useIntersectionObserver` on it to show/hide the mobile sticky bar only when the real button is off-screen
- Review stats fetched once in `ProductDetailView` (1-item request) to populate the tab badge count; `ProductReviews` independently fetches its own paginated list on mount
- `ReviewForm` does not send `orderId` — the backend 403 response handles purchase verification; frontend shows the Persian error message clearly
- `RelatedProducts` filters out `excludeId` client-side after fetch (avoids extra query param)
- Color swatches use a static `colorMap` (Persian color names → hex) for swatch rendering; unknown colors fall back to `#888`
- `out-in` transition on all tab content switches prevents flash during re-render
- `document.title` updated on fetch; restored to default on `onUnmounted`
- `watch(() => route.params.slug)` enables seamless navigation between product pages from the Related Products row without full page reload

---

## Admin Panel — storein-admin ✅

Completely separate Vite project at `storein-admin/`. Shares the same NestJS backend.
Dev server runs on **port 4000** (`npm run dev` inside `storein-admin/`).

### Stack
| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build | Vite 8 |
| State | Pinia |
| Styling | Tailwind CSS v3 + PostCSS |
| HTTP | Axios |
| Utils | dayjs, @vueuse/core |
| Charts | vue-chartjs + chart.js (registered globally in `src/plugins/chartjs.js`) |

### Auth Flow
- Same OTP flow as storefront — but `verifyOtp` adds an **admin check**: if `data.user.isAdmin !== true`, throws `{ isAdminError: true }` and blocks login
- Tokens stored under `admin_token` / `admin_refresh_token` keys (separate from storefront)
- Router `beforeEach` guard: admin routes require `auth.isLoggedIn` (token + isAdmin); calls `fetchProfile()` once per session
- 401 → redirect to `/login`; 403 → redirect to `/login?error=forbidden`

### Project Structure
```
storein-admin/src/
├── assets/styles/       main.css · variables.css · fonts.css
├── components/
│   ├── common/          11 reusable AdminXxx components
│   └── layout/          AdminSidebar · AdminHeader
├── composables/         useApi.js
├── layouts/             AdminLayout · AuthLayout
├── views/               11 fully implemented views
├── router/              index.js — 13 routes
├── services/            10 service files
├── stores/              auth.store · ui.store
└── utils/               formatters.js · constants.js
```

### Common Components
| Component | Description |
|-----------|-------------|
| `AdminButton` | 4 variants (primary/secondary/danger/ghost) × 3 sizes, loading spinner |
| `AdminInput` | v-model, label, error, hint, focus ring, prepend/append |
| `AdminSelect` | Dropdown with options array, same styling as AdminInput |
| `AdminTextarea` | Resizable textarea, configurable rows |
| `AdminBadge` | 6 color variants (success/warning/error/info/gray/navy), 2 sizes |
| `AdminSkeleton` | Pulse skeleton, circle mode, configurable dimensions |
| `AdminTable` | Column-definition driven; named `cell-{key}` slots; sort emit; skeleton + empty states |
| `AdminModal` | Teleport to body; sm/md/lg sizes; body + footer slots; ESC close; scroll lock |
| `AdminConfirm` | Delete confirmation dialog built on AdminModal |
| `AdminPagination` | Ellipsis pagination (max 7 buttons), scrolls to top on change |
| `AdminToast` | Fixed top-center; TransitionGroup; reads from `useUiStore().toasts` |

### Layout
- **AdminSidebar**: dark navy (`#0F172A`) — desktop collapsible (256 → 64px) with tooltip on hover; mobile: full-width drawer with overlay; nav groups (داشبورد / فروشگاه / مدیریت); logout button; "مشاهده سایت" link to port 3000
- **AdminHeader**: sticky; desktop toggle button (collapse sidebar); mobile hamburger; user name + initials avatar in top-right

### Views Implemented
| View | Route | Features |
|------|-------|---------|
| `LoginView` | `/login` | 2-step phone+OTP; countdown timer; admin rejection error; dev OTP banner |
| `DashboardView` | `/dashboard` | Full Phase A2 implementation — see section below |
| `ProductsView` | `/products` | Table with image+name, price, stock badge, status badge; search + status filter; delete confirm |
| `ProductFormView` | `/products/create` `/products/:id/edit` | Create/edit form: name, status, category select, description, tag input (Enter to add), variant rows (SKU/price/comparePrice/stock/attributes) |
| `CategoriesView` | `/categories` | Flat table; create/edit modal; delete confirm; parent selector |
| `OrdersView` | `/orders` | Table with order number, user, amount, status badge, date; status filter |
| `OrderDetailView` | `/orders/:id` | Header with status change select; items table with totals; shipping address |
| `UsersView` | `/users` | Table with avatar initials, role badge, active badge; block/unblock toggle |
| `UserDetailView` | `/users/:id` | Profile card with name, phone, role, status, join date, address count |
| `ReviewsView` | `/reviews` | Table with user, rating, comment preview, status badge; approve/reject/delete actions |
| `DiscountsView` | `/discounts` | Table with code, type badge, value, usage count, active status; create/edit modal; deactivate action |

### Services (endpoint mapping)
| Service | Base path |
|---------|-----------|
| `auth` | `/auth/send-otp`, `/auth/verify-otp`, `/users/me` |
| `dashboard` | `/admin/dashboard` |
| `product` | `/products/admin`, `/products` (CRUD) |
| `category` | `/categories` (admin uses same endpoints) |
| `order` | `/orders/admin` |
| `user` | `/users` (admin endpoints) |
| `review` | `/reviews/admin` |
| `discount` | `/discounts` |
| `upload` | `/upload/image?folder=` |

### Key Decisions
- Tailwind v3 pinned explicitly (`tailwindcss@3`) — v4 installed by default breaks the PostCSS plugin interface
- `postcss.config.js` created manually (v3 `tailwindcss` + `autoprefixer`)
- `admin_token` localStorage key is distinct from storefront's `access_token` — both panels can be open simultaneously without token collision
- `useApi(fn)` composable wraps any service function with `{ data, loading, error, execute }` — reduces boilerplate in views
- Sidebar collapse state lives in `ui.store` (Pinia) — persists across route navigations within the session
- All table views use `Promise.allSettled`-style error handling — individual fetch failures toast without crashing the page
- Font path warnings at build time are expected — woff2 files resolve at runtime; Tahoma fallback is readable meanwhile

### Build Output (Phase A1)
```
133 modules transformed
dist/assets/index-BX_U3Xyr.css   23.82 kB │ gzip:  5.36 kB
dist/assets/index-Bh7X8Lsc.js   166.89 kB │ gzip: 63.17 kB
✓ built in 1.05s — 0 errors
```

---

## Admin Phase A2 — Dashboard ✅

### New Files
| File | Purpose |
|------|---------|
| `src/plugins/chartjs.js` | Global Chart.js registration (Line, Bar, Doughnut, Filler, all scales) + RTL/Persian defaults (`legend.rtl`, `tooltip.rtl`, IRANSans font) |
| `src/views/dashboard/components/StatCard.vue` | KPI card: icon circle, large value (`font-fanum`), sub-label, optional trend badge (↑green/↓red); skeleton state |
| `src/views/dashboard/components/RevenueChart.vue` | Dual-axis Line chart — revenue (right Y, fill) + orders (left Y); Persian day labels; custom legend strip; empty state |
| `src/views/dashboard/components/OrderStatusChart.vue` | Doughnut (68% cutout) — 6 status segments; custom color legend grid below chart; empty state |
| `src/views/dashboard/components/TopProductsChart.vue` | Horizontal Bar chart (`indexAxis: 'y'`) — 5 products; opacity-gradient primary blue bars; empty state |
| `src/views/dashboard/components/RecentOrdersTable.vue` | Wraps `AdminTable` — order number link, customer name+phone, status badge, formatted price, date, eye-icon action |
| `src/views/dashboard/components/QuickActions.vue` | 4-tile grid (محصول جدید / سفارشات / نظرات / دسته‌بندی‌ها); notification badge on pending counts |

### Updated Files
| File | Change |
|------|--------|
| `src/main.js` | Added `import '@/plugins/chartjs'` before App import |
| `src/views/dashboard/DashboardView.vue` | Full replacement: welcome header + Persian date + refresh button; 4 StatCards; Revenue+OrderStatus charts row (3/5 + 2/5 grid); RecentOrders+TopProducts row (3/5 + 2/5); QuickActions |

### Dashboard Layout
```
① Welcome header + Persian date + refresh button
② StatCards ×4  (درآمد کل / کل سفارشات / کاربران / محصولات)
③ RevenueChart (lg:col-span-3)  +  OrderStatusChart (lg:col-span-2)
④ RecentOrdersTable (lg:col-span-3)  +  TopProductsChart (lg:col-span-2)
⑤ QuickActions (4 tiles)
```

### Key Decisions
- Chart.js registered once in `src/plugins/chartjs.js`, imported in `main.js` before App — never inside components; avoids duplicate-registration warnings
- `RevenueChart` uses two Y axes: `y` (position: right, درآمد) and `y1` (position: left, سفارشات) — RTL convention puts the primary axis on the right
- Skeleton heights in `RevenueChart` and bar widths in `TopProductsChart` are fixed arrays, not `Math.random()` — avoids hydration mismatch and Vue reactivity issues
- `OrderStatusChart` builds `legendItems` by filtering out zero-count statuses — prevents empty legend slots when some statuses have no orders
- `DashboardView.loadStats()` reads `res.data ?? res ?? {}` — handles both wrapped and unwrapped responses safely
- `loadPendingReviews()` is fire-and-forget inside `Promise.allSettled` — failure does not block the rest of the dashboard
- `QuickActions` badge shows `null` (not `0`) when count is zero — prevents a `0` badge from rendering

### Build Output (Phase A2)
```
144 modules transformed
DashboardView-DHQ3BmLe.js   17.43 kB │ gzip:  6.29 kB
index-DNayTpoG.js          357.47 kB │ gzip: 129.17 kB  (includes chart.js)
✓ built in 1.07s — 0 errors
```

---

## Admin Phase A3 — Product Management ✅

### New Files
| File | Purpose |
|------|---------|
| `src/composables/useDebounce.js` | Lightweight debounce composable — wraps a computed/ref source, emits after configurable delay (default 400ms); avoids `@vueuse/core` dependency in filter components |
| `src/views/products/components/ProductFilters.vue` | Search + category/status/sort dropdowns; search debounced via `useDebounce`; category/status/sort emit instantly; reset button appears only when a filter is active |
| `src/views/products/components/ImageUploader.vue` | Drag-and-drop + click-to-upload; multi-file parallel upload to `/upload/image`; main-image badge on first slot; hover overlay for set-main (⭐) and remove (✕); file-type validation before upload |
| `src/views/products/components/VariantEditor.vue` | Dynamic variant rows: SKU / price / comparePrice / stock + key-value attribute editor; preset quick-add buttons (رنگ / شکل فریم / جنس فریم / اندازه); rename attribute key on blur; add / remove variant rows; comparePrice warning when ≤ price |
| `src/views/products/components/TagInput.vue` | Chip-based tag input; Enter / comma / Tab / button to add; × chip button to remove; duplicate guard |

### Updated Files
| File | Change |
|------|--------|
| `src/views/products/ProductsView.vue` | Full replacement: header with item count; `ProductFilters` component; `AdminTable` with image+name cell, inline status `<select>` (optimistic update + rollback), stock color-coding, edit/delete action buttons; `AdminConfirm` delete dialog; `AdminPagination` |
| `src/views/products/ProductFormView.vue` | Full replacement: 2-column layout (main + sidebar); separate "ذخیره پیش‌نویس" and "انتشار محصول" buttons; `VariantEditor`, `ImageUploader`, `TagInput`, status radio group, stats panel (edit mode only); per-variant validation errors; `fillForm()` maps API response to form reactive object |

### ProductsView Behaviour
| Action | Behaviour |
|--------|-----------|
| Search | Debounced 400ms → page reset to 1 → fetch |
| Category / Status / Sort | Instant → page reset to 1 → fetch |
| Status select (inline) | Optimistic update in UI → API call → rollback on error |
| Delete | Opens `AdminConfirm` → API call → removes row from local array (no re-fetch) |
| Pagination | Page change → fetch with current filters |

### ProductFormView Behaviour
| Action | Behaviour |
|--------|-----------|
| "ذخیره پیش‌نویس" | Validates name + category only → saves with `status: 'draft'` → on create: `router.replace` to edit URL (no page-load flicker) |
| "انتشار محصول" | Full validation including variant prices → saves with `status: 'active'` → on create: `router.push('/products')` |
| Image upload | Parallel `Promise.all` per file → appended to `form.images` array → first image is the main/cover image |
| Edit mode | Loads product by ID on mount → `fillForm()` populates all reactive fields; slug shown read-only |

### Key Decisions
- `useDebounce` is a custom composable (not `useDebounceFn` from `@vueuse/core`) — keeps the filter component self-contained and avoids importing the full VueUse library
- `ProductFilters` emits a single `change` event object — parent holds `activeFilters` ref and resets `page` to 1 before re-fetching
- Inline status `<select>` uses optimistic update: sets `row.status` immediately, rolls back on API error — avoids stale-data flash
- `VariantEditor` is fully controlled (v-model) — it never mutates props directly; all attribute mutations (add / rename / remove) reconstruct the array immutably via `map`
- `ImageUploader` calls `Promise.all` for parallel uploads when multiple files are dropped at once
- `buildDto` in `ProductFormView` preserves existing `_id` on variants so the backend can match and update them instead of re-creating
- Validation split: draft save = name + category only; publish = full including per-variant price/stock checks
- API `ValidationPipe` can return an array of messages — `publish()` handles `Array.isArray(msg)` and toasts each one

### Build Output (Phase A3)
```
150 modules transformed
ProductsView-BPETwnrf.js      8.44 kB │ gzip:  3.52 kB
ProductFormView-__stZs4G.js  21.30 kB │ gzip:  6.98 kB
✓ built in 1.15s — 0 errors
```

---

## Admin Phase A4 — Category & Order Management ✅

### New Files
| File | Purpose |
|------|---------|
| `src/views/categories/components/CategoryFormModal.vue` | Create/edit modal: name (required), slug (read-only on edit), parent select (roots only), description textarea, image upload (max 1 via ImageUploader), order number input, isActive toggle (custom CSS switch) |
| `src/views/categories/components/CategoryTreeRow.vue` | Single `<tr>` for the tree table — RTL-aware indentation via `paddingRight: depth * 24px`; expand/collapse chevron button; 📁/📂 icon or thumbnail; delete button disabled when category has children or products |
| `src/views/orders/components/OrderFilters.vue` | Search (debounced 400ms) + status dropdown + date-range inputs (`startDate` / `endDate`); reset button appears when any filter is active |
| `src/views/orders/components/OrderStatusUpdater.vue` | 5-step visual stepper (pending→paid→processing→shipped→delivered) with done/current/upcoming states; cancelled accessible via select only; ⚠️ warning text when cancelled is selected; "ثبت تغییر" disabled until a different status is picked |

### Updated Files
| File | Change |
|------|--------|
| `src/views/categories/CategoriesView.vue` | Full replacement: header with count; search + reload toolbar; custom `<table>` with `CategoryTreeRow` components; expand/collapse via `Set` reassignment (forces Vue reactivity); `flattenTree()` DFS traversal; `flatList` computed for count + search bypass; `CategoryFormModal` + `AdminConfirm` dialogs |
| `src/views/orders/OrdersView.vue` | Full replacement: `OrderFilters` component; `AdminTable` with order-number link, customer name+phone, price, status badge, date, eye-icon action; `AdminPagination` |
| `src/views/orders/OrderDetailView.vue` | Full replacement: back button + order number (dir=ltr) + status badge in header; `OrderStatusUpdater`; 2-col info cards (customer + financial summary); shipping address card; order items list with image/name/qty/price |

### CategoriesView — Tree Behaviour
| Action | Behaviour |
|--------|-----------|
| Initial load | Fetches `/categories/tree`; all root nodes with children auto-expanded |
| Expand/collapse | Reassigns `expandedIds = new Set(...)` — forces Vue 3 reactivity on Set mutation |
| Search active | Bypasses tree structure; shows all matching nodes flat with estimated depth |
| Create | Opens empty modal → `categoryService.create()` → `loadTree()` |
| Edit | Opens pre-filled modal (synced via `watch(modelValue)`) → `categoryService.update()` → `loadTree()` |
| Delete | Disabled when `children.length > 0` or `productsCount > 0`; confirm dialog → `categoryService.remove()` → `loadTree()` |

### OrderDetailView — Status Update Flow
- `OrderStatusUpdater` emits `updated(newStatus)` when admin clicks "ثبت تغییر"
- `OrderDetailView.updateStatus()` calls `orderService.updateStatus()` and replaces `order.value` with the API response (full object update)
- `document.title` set to order number on load; restored on `onUnmounted`

### Key Decisions
- `expandedIds` is `ref(new Set())` — Vue 3 does not track Set mutations so `toggleExpand` reassigns the ref to a new Set instance to trigger reactivity
- `CategoryFormModal` uses a single `formImages` ref (`[{ url, thumbnail }]`, max 1) and passes `formImages.value[0]` as `image` in the DTO — reuses `ImageUploader` from products
- `ImageUploader` is imported cross-view (`@/views/products/components/ImageUploader.vue`) — acceptable for a self-contained utility component
- Category search when active shows all matching nodes flat, ignoring tree nesting — simpler and more useful for quick finds in large trees
- `OrderFilters` sends `undefined` (not empty string) for unset filters — prevents backend from treating `""` as a filter value
- `OrderStatusUpdater.allowedTransitions` filters out `pending` once order is past that stage — prevents regression to an earlier state via the UI

### Build Output (Phase A4)
```
154 modules transformed
CategoriesView-CkGi5X_7.js    13.51 kB │ gzip:  4.91 kB
OrdersView-BEoQGsnn.js         5.31 kB │ gzip:  2.39 kB
OrderDetailView-a3nY3mRA.js    9.56 kB │ gzip:  3.70 kB
✓ built in 1.57s — 0 errors
```

---

## Admin Phase A5 — User, Review & Discount Management ✅

Final admin phase. Replaces all remaining stubs with full implementations.

### New Files
| File | Purpose |
|------|---------|
| `src/views/discounts/components/DiscountFormModal.vue` | Create/edit modal: code input (auto-uppercase, auto-generate button), type pill selector (درصدی / ثابت), value + unit suffix, `maxDiscount` shown only for percentage, min order amount, usage limit, date range with end > start validation, isActive CSS toggle |

### Updated Files
| File | Change |
|------|--------|
| `src/views/users/UsersView.vue` | Full replacement: debounced name/phone search + blocked filter; `AdminTable` with avatar initials (red when blocked), admin badge, orders count, total spent, join date; optimistic block/unblock with rollback; icon-only action buttons (eye + lock/unlock) |
| `src/views/users/UserDetailView.vue` | Full replacement: back button + block/unblock header button; 2-col grid (user info card + purchase stats card with average per-order); address cards with default badge; recent orders mini-table; `document.title` sync |
| `src/views/reviews/ReviewsView.vue` | Full replacement: pending-count pulse badge in header; status tab switcher (همه / در انتظار / تأیید شده / رد شده); debounced search; product thumbnail + name cell; rating star row; expand/collapse long comments; inline approve/reject/delete with `actionLoading` guard |
| `src/views/discounts/DiscountsView.vue` | Full replacement: search + active filter; table with code chip, type/value, usage progress bar, expiry warning (⚠️ red if past), inline toggle switch, edit/delete actions; `DiscountFormModal` + `AdminConfirm` |
| `src/services/discount.service.js` | Added `toggle` method → `PATCH /discounts/:id/toggle` |

### UsersView Behaviour
| Action | Behaviour |
|--------|-----------|
| Search | Debounced 400ms → page 1 → fetch |
| Blocked filter | Instant → page 1 → fetch (`isBlocked=true/false`) |
| Block / Unblock | Optimistic flip → `PATCH /users/:id/block` → sync from response; rollback on error |
| Row click | `RouterLink` to `/users/:id` |
| Admin rows | Lock/unlock button hidden for admin accounts |

### UserDetailView Behaviour
| Section | Content |
|---------|---------|
| Info card | Avatar initials, name, phone, badges (فعال/مسدود + ادمین), join date, last activity |
| Stats card | Orders count, total spent (Toman), average per order (computed) |
| Addresses | Grid of address cards; default address highlighted with primary border |
| Recent orders | Mini table (last 5): order number, status badge, total, date, eye-link to detail |

### ReviewsView Behaviour
| Action | Behaviour |
|--------|-----------|
| Tab switch | Sets `activeStatus`, resets page, re-fetches |
| Approve | `PATCH /reviews/admin/:id/status {approved}` → mutates `row.status`; decrements `pendingCount` |
| Reject | Same but `rejected`; decrements `pendingCount` |
| Delete | Confirm dialog → removes from local array; decrements `total` + `pendingCount` if was pending |
| Expand comment | Toggle per-row `expandedId` — inline expanded block below truncated preview |

### DiscountsView Behaviour
| Action | Behaviour |
|--------|-----------|
| Toggle switch | Optimistic flip → `PATCH /discounts/:id/toggle` → sync `isActive`; rollback on error |
| Create | Opens `DiscountFormModal` (discount=null) → on `saved`: re-fetches list |
| Edit | Opens `DiscountFormModal` (discount=row) → on `saved`: replaces row in-place (no re-fetch) |
| Delete | `AdminConfirm` → removes row from local array; decrements `total` |
| Usage bar | Progress bar width = `usedCount / usageLimit × 100%`; turns warning-yellow above 80% |
| Expiry warning | Date cell turns red + ⚠️ prefix when `endDate` is in the past |

### Key Decisions
- `UserDetailView` calls `orderService.getAll({ userId })` for recent orders — filter is advisory; backends without `userId` param will return all orders (handled gracefully via `Promise.allSettled`)
- `ReviewsView` tab switcher calls `fetchReviews()` directly (not via `watch`) — avoids double-fetch race on initial mount
- `pendingCount` is returned by the backend on every `GET /reviews/admin` call and re-synced on fetch; locally decremented on approve/reject/delete to keep the header badge accurate without re-fetching
- `DiscountFormModal` syncs its reactive `form` via `watch(() => props.modelValue)` — safe to close and reopen for create vs. edit without stale data
- Code input strips non-`[A-Z0-9-]` characters on `@input` and forces uppercase — prevents invalid codes reaching the backend
- `maxDiscount` field rendered conditionally (`v-if="form.type === 'percentage'"`) — no null-clearing needed when switching to fixed type
- Toggle switch in `DiscountsView` uses `togglingId` ref rather than per-row `loading` — single shared ref is sufficient since only one toggle fires at a time

### Build Output (Phase A5)
```
154 modules transformed
UsersView-Ce4Odp4S.js          6.21 kB │ gzip:  2.69 kB
ReviewsView-CgRC419d.js        7.95 kB │ gzip:  3.14 kB
UserDetailView-DYcz8FUf.js     8.93 kB │ gzip:  3.21 kB
DiscountsView-DjMa9SkL.js     15.57 kB │ gzip:  5.53 kB  (includes DiscountFormModal)
✓ built in 1.32s — 0 errors
```

---

## Admin Panel — Complete ✅

All 5 admin phases done. Full module summary:

| Phase | Module | Views |
|-------|--------|-------|
| A1 | Project setup + auth + layout + base components | Login, shell |
| A2 | Dashboard | DashboardView (charts + KPIs) |
| A3 | Product management | ProductsView, ProductFormView |
| A4 | Category + Order management | CategoriesView, OrdersView, OrderDetailView |
| A5 | User + Review + Discount management | UsersView, UserDetailView, ReviewsView, DiscountsView |

**Total views:** 11 fully implemented  
**Dev server:** port 4000 (`npm run dev` inside `storein-admin/`)

---

## Frontend Phase 5 — Product Listing + Search ✅

### New Files
| File | Purpose |
|------|---------|
| `src/components/common/BasePagination.vue` | Ellipsis pagination (max 7 buttons); prev/next arrows; `window.scrollTo` on change; `font-fanum` |
| `src/views/products/components/FilterSidebar.vue` | Desktop filter panel (w-64, sticky); 6 accordion sections; direct store mutation pattern |
| `src/views/products/components/FilterMobileDrawer.vue` | Bottom-sheet drawer (Teleport); local filter copy for cancel-without-apply; slide-up transition |
| `src/views/products/components/SortBar.vue` | Desktop inline sort buttons + mobile `<select>`; product count with skeleton; "فیلتر" mobile trigger |
| `src/views/products/components/ActiveFilters.vue` | Removable chip row; `TransitionGroup` chip animation; maps filter values to Persian labels |
| `src/views/products/components/ProductGrid.vue` | 2/3/4-col responsive grid; skeleton placeholders; delegates add-to-cart + wishlist toggle |

### Updated Files
| File | Change |
|------|--------|
| `src/stores/product.store.js` | Rewrote: `filters` → `reactive({})`, new multi-select fields (`genders[]`, `frameShapes[]`, `frameMaterials[]`), `toQueryParams()` / `fromQueryParams()`, `get totalPages()` accessor |
| `src/services/product.service.js` | Fixed two wrong endpoints: `getBySlug` → `/products/slug/${slug}`; `search` → `/search` (was `/products/search`) |
| `src/views/products/ProductListView.vue` | Full implementation: breadcrumb, sidebar, sort bar, active chips, grid, pagination, mobile drawer; works for both `/products` and `/category/:slug` |
| `src/views/products/SearchView.vue` | Full implementation: search header, sort bar, grid, pagination; watches `route.query.q` so header search nav auto-triggers re-fetch |

### Filter Sections (FilterSidebar + FilterMobileDrawer)
| Section | Type | Filters → API param |
|---------|------|---------------------|
| دسته‌بندی | radio (single) | `category` slug |
| جنسیت | checkbox (multi) | `gender=men,women` |
| شکل فریم | pill toggle (multi) | `frameShape=round,oval` |
| جنس فریم | checkbox (multi) | `frameMaterial=steel,acetate` |
| محدوده قیمت | text inputs | `minPrice`, `maxPrice` |
| فقط موجود | checkbox | `inStock=true` |

### Key Decisions
- `FilterSidebar` mutates `productStore.filters` directly (reactive object reference passed as prop) — no v-model copy needed; emits `change` to trigger debounced fetch in parent
- `FilterMobileDrawer` keeps a **local copy** of filters so closing without "نمایش نتایج" discards changes; emits `apply(filters)` only on confirm
- `useDebounceFn(300ms)` on all filter changes — prevents a request per keystroke on price inputs
- `router.replace()` (not push) for URL sync — back button stays clean
- `/category/:slug` route reuses `ProductListView`; slug sets `filters.category` and is excluded from `toQueryParams()` so it doesn't duplicate into `?category=`
- `productStore.totalPages` is a plain `get` accessor (not a Vue computed) — returns `Math.ceil(total / limit)` reactively because `total` is a ref and Pinia tracks access
- `BasePagination` always shows 7 or fewer buttons with ellipsis (e.g. `[1][…][8][9][10][11][12][…][20]`)
- `ActiveFilters` resolves display labels from constants (`EYEWEAR_CATEGORIES`, `GENDER_OPTIONS`, etc.) — no label stored in filter state
- `SearchView` is independent of `productStore` — uses local refs + direct `productService.search()` call

---

## Frontend Phase 4 — OTP Auth Flow ✅

### New Files
| File | Purpose |
|------|---------|
| `src/views/auth/components/OtpInput.vue` | Reusable 5-box OTP input; auto-advance, backspace, paste, `defineExpose({ focus })` |
| `src/views/auth/LoginView.vue` | Phone entry card — flag prefix, LTR input, inline validation, `sendOtp` → navigate to OTP |
| `src/views/auth/OtpView.vue` | OTP verify card — masked phone, 5 boxes, 2-min countdown, resend, auto-submit on complete |

### Updated Files
| File | Change |
|------|--------|
| `src/stores/auth.store.js` | Added `pendingPhone` ref; `verifyOtp` persists refresh token; `_postLoginSync()` (lazy import → no circular dep); full `logout()` clears cart + wishlist state |

### Endpoints Used
| Endpoint | Trigger |
|----------|---------|
| `POST /auth/send-otp` | LoginView submit → `authStore.sendOtp()` |
| `POST /auth/verify-otp` | OtpView verify → `authStore.verifyOtp()` |

### Flow
```
/auth/login
  → enter phone → validatePhone() → sendOtp()
    → pendingPhone stored in auth store
      → router.push({ name: 'otp' })

/auth/otp
  → guard: no pendingPhone → router.replace({ name: 'login' })
  → enter 5 digits (auto-advance) → handleComplete() → verifyOtp()
    → tokens saved to localStorage
    → _postLoginSync(): fetchCart() + fetchWishlist() (fire-and-forget)
    → router.push(redirect || { name: 'home' })
```

### Key Decisions
- `pendingPhone` lives in the store (not query params) — survives refresh within session, not exposed in URL
- `OtpInput` uses `:ref="el => inputs[index] = el"` (Vue 3 function ref) — required for dynamic list of refs
- Inline errors for 400/429 (no toast); toast only for unexpected 5xx
- `otpCode` cleared + first box re-focused on any verify failure
- `LoginView` pre-fills phone from `pendingPhone` when user navigates back from OTP page
- Dev banner (`v-if="isDev"`) reminds developer to check NestJS console for the mock OTP
- `logout()` uses dynamic `import()` for cart/wishlist stores to avoid circular dependency at module load time

---

## Hotfix — Font: IRANYekan → IRANSans (IRANSansWeb FaNum) ✅

### Updated Files
| File | Change |
|------|--------|
| `src/assets/styles/fonts.css` | Replaced 4 IRANYekan `@font-face` blocks with 8 blocks: `IRANSans` (4 weights) + `IRANSansFaNum` (4 weights). CDN option documented in comments. |
| `src/assets/styles/variables.css` | `--font-family: 'IRANSans', 'Tahoma', system-ui, sans-serif` |
| `tailwind.config.js` | `fontFamily: { sans: ['IRANSans', ...], fanum: ['IRANSansFaNum', ...] }` — added `fanum` key for Persian numerals |
| `src/assets/styles/main.css` | Added `.font-fanum` utility class in `@layer components` |
| `src/components/common/BaseProductCard.vue` | `font-fanum` on compare-price + main-price spans |
| `src/views/home/components/FlashSale.vue` | `font-fanum` on countdown digit spans |
| `src/components/layout/AppHeaderActions.vue` | `font-fanum` on notification badge + cart badge spans |
| `src/components/layout/AppMobileNav.vue` | `font-fanum` on mobile cart badge span |

### Key Decisions
- Two font families registered: `IRANSans` (body text) and `IRANSansFaNum` (prices/counters) — FaNum renders Persian-style numerals (٠١٢٣...) instead of Latin (0123...)
- `font-fanum` is a plain CSS class in `@layer components`, not a Tailwind utility, so it works anywhere including inline styles
- `tailwind.config.js` `fanum` key generates `font-fanum` as a Tailwind utility class (`font-family: fanum`) in addition to the plain CSS version
- All badge counts (`۹۹+`, cart total, unread count) use FaNum so numerals match the RTL UI
- Font files go in `src/assets/fonts/`; Tahoma fallback ensures readable text until woff2 files are placed

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
| ~~1~~ | ~~`LoginView` + `OtpView`~~ | ~~done in Phase 4~~ | ~~done~~ |
| ~~2~~ | ~~`ProductListView`~~ | ~~done in Phase 5~~ | ~~done~~ |
| ~~3~~ | ~~`ProductDetailView`~~ | ~~done in Phase 6~~ | ~~done~~ |
| ~~4~~ | ~~`SearchView`~~ | ~~done in Phase 5~~ | ~~done~~ |
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

---

## Hotfixes — Dev Environment & Auth Flow ✅

### 1 — Redis not installed (500 on send-otp)

`sendOtp` immediately calls `redis.incr()` for rate-limiting; without Redis the call throws → NestJS returns 500.

**Fix:** installed Redis for Windows via winget:
```
winget install --id Redis.Redis -e
```
Redis runs as a Windows Service on `localhost:6379` and auto-starts with Windows.

---

### 2 — Wrong API port in frontend (404 on all requests)

| File | Before | After |
|------|--------|-------|
| `storein-front/.env` | `VITE_API_BASE_URL=http://localhost:3001/api/v1` | `http://localhost:3000/api/v1` |

Backend runs on port `3000` (set in `storein/.env`). Frontend `.env` had `3001` — every request returned 404.

---

### 3 — OTP length mismatch (400 on verify-otp)

`OTP_LENGTH` in `storein/.env` was changed to `5` to match the `OtpView` (which renders 5 boxes), but `VerifyOtpDto` still validated `@Length(6, 6)`.

| File | Before | After |
|------|--------|-------|
| `storein/.env` | `OTP_LENGTH=6` | `OTP_LENGTH=5` |
| `modules/auth/dto/verify-otp.dto.ts` | `@Length(6, 6, { message: '... ۶ رقم ...' })` | `@Length(5, 5, { message: '... ۵ رقم ...' })` |

---

### 4 — Country code badge on wrong side of phone input

In RTL flexbox the first DOM child renders on the **right**. The country prefix `🇮🇷 +98` was the first child → appeared on the right. User requested it on the left.

**Fix in `storein-front/src/views/auth/LoginView.vue`:**
- Moved the country-prefix `<div>` to **after** the `<input>` in the DOM (last child → left side in RTL)
- Changed `border-l-2` → `border-r-2` so the separator line stays between input and prefix

---

### 5 — Login succeeds but immediately logs out (token never saved)

Two bugs in the auth flow caused an immediate redirect back to `/auth/login` after OTP verification:

**Bug A — camelCase mismatch:** Backend returns `{ accessToken, refreshToken }` but `auth.store.js` was reading `data.access_token` / `data.refresh_token` (snake_case) → both were `undefined` → `localStorage` stored the string `"undefined"` → `isLoggedIn` became `false`.

**Bug B — wrong profile endpoint:** `authService.getProfile()` called `/auth/me` which doesn't exist in the backend (returns 404 → http interceptor catches 401-like failures).

| File | Before | After |
|------|--------|-------|
| `src/stores/auth.store.js` | `data.access_token` / `data.refresh_token` / `user.value = data.user` | `data.accessToken` / `data.refreshToken` / `await fetchProfile()` |
| `src/services/auth.service.js` | `getProfile: () => http.get('/auth/me')` | `http.get('/users/me')` |

---

## Session 2 — Bug Fixes + Features (2026-06-04)

---

### Admin Panel — Bootstrap & Auth Fixes ✅

**Fix 1 — Wrong API port in admin panel**
`storein-admin/.env` had `VITE_API_BASE_URL=http://localhost:3001/api/v1` → changed to `3000`.

**Fix 2 — Admin login: user object missing from verifyOtp response**
Backend `verifyOtp` returns `{ accessToken, refreshToken, isNewUser }` — NO `user` object.
Admin `auth.store.js` was checking `data.user?.isAdmin` (always undefined → threw `isAdminError`).

Fix in `storein-admin/src/stores/auth.store.js`:
1. Save token first, then call `getProfile()` to fetch user with `isAdmin`
2. `data.access_token` → `data.accessToken`, `data.refresh_token` → `data.refreshToken`

**Fix 3 — CategoryFormModal: wrong DTO field names**
| Field sent (wrong) | Field expected by backend |
|--------------------|--------------------------|
| `parentId` | `parent` |
| `order` | `sortOrder` |
| `image: { original: { url } }` | `image: string` (URL) |

**Fix 4 — ProductFormView: categories not loading**
`data?.items` assumed paginated response, but `GET /categories` returns a plain array.
Fix: `Array.isArray(data) ? data : (data?.items ?? [])`.

---

### Brand Module ✅

New full-stack brand management feature.

**Backend — `storein/src/modules/brand/`**
| File | Purpose |
|------|---------|
| `entities/brand.schema.ts` | Brand schema: name, slug (auto), logo, description, isActive, sortOrder |
| `dto/create-brand.dto.ts` | Create DTO |
| `dto/update-brand.dto.ts` | Update DTO (PartialType) |
| `brand.service.ts` | CRUD + slug auto-generate with duplicate suffix |
| `brand.controller.ts` | GET public, GET/POST/PATCH/DELETE admin |
| `brand.module.ts` | Registered in AppModule |

Updated files:
- `product.schema.ts` — `brand?: Types.ObjectId` ref added
- `create-product.dto.ts` — `@IsOptional() @IsMongoId() brand?` added
- `app.module.ts` — BrandModule imported

**Endpoints**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/brands` | Public | لیست برندهای فعال |
| GET | `/api/v1/brands/:id` | Public | جزئیات |
| GET | `/api/v1/brands/admin/all` | Admin | همه برندها |
| POST | `/api/v1/brands` | Admin | ایجاد |
| PATCH | `/api/v1/brands/:id` | Admin | ویرایش |
| DELETE | `/api/v1/brands/:id` | Admin | حذف |

**Admin Frontend**
- `storein-admin/src/services/brand.service.js`
- `storein-admin/src/views/brands/BrandsView.vue` — لیست + ایجاد/ویرایش/حذف + آپلود لوگو
- Router: `/brands` route اضافه شد
- Sidebar: «برندها» 🔖 در بخش فروشگاه
- `ProductFormView.vue` — brand select زیر category select

---

### Dark Mode + Search Bar Redesign ✅ (storein-front)

**Dark Mode Strategy**
- `tailwind.config.js` — `darkMode: 'class'`
- `variables.css` — `html.dark` overrides CSS vars: `--color-bg: #0F172A`, `--color-card: #1E293B`, `--color-border: #334155`, text vars
- `main.css` — `html.dark .bg-surface / .bg-surface-card / .text-text-*` overrides (no `!important` conflicts; NO Tailwind `dark:` classes used — they generated `@media prefers-color-scheme` instead of `.dark` selector)
- `src/composables/useTheme.js` — toggle composable; reads `localStorage` + `prefers-color-scheme` on init
- `main.js` — IIFE applies theme class before first render (prevents flash)

**All `bg-white` instances (25+ files) replaced** with `style="background-color: var(--color-card)"` inline or `bg-surface-card` Tailwind class so they auto-switch with dark mode.

Key files updated: `AuthLayout`, `BaseModal`, `BaseToast`, `BaseInput`, `BaseProductCard`, `AppHeader`, `AppHeaderNav`, `AppMobileNav`, `AppMobileDrawer`, `FilterSidebar`, `FilterMobileDrawer`, `SortBar`, `ProductGrid`, `ProductRow`, `TrustStrip`, `FlashSale`, `ProductTabs`, `ProductReviews`, `ProductGallery`, `ProductDetailView` sticky bar, `SearchView`, `OtpInput`, `LoginView`, `OtpView`.

**Search Bar Redesign** (`AppHeaderSearch.vue`)
- Pill shape (rounded-full) with focus glow (`ring-brand/12`)
- «جستجو» button inside the input
- `Ctrl+K` shortcut to focus
- Dropdown: section headers, icon chips, «جستجو برای...» footer button
- All colors via CSS vars (dark-aware)

**Dark Mode Toggle** in `AppHeaderActions.vue`
- Moon 🌙 icon = currently light mode (click → dark)
- Sun ☀️ icon = currently dark mode (click → light)

---

### Mobile Hamburger Menu ✅ (storein-front)

`AppMobileDrawer.vue` created — previously `toggleMenu()` set `isMenuOpen` but no component listened.

Features:
- Slide-in از سمت راست (RTL-aware transition)
- نمایش نام کاربر یا دکمه ورود
- دسته‌بندی‌های دینامیک از store با **expand/collapse** زیردسته‌ها
  - کلیک نام دسته → navigate
  - کلیک chevron → toggle زیردسته‌ها (بدون navigate)
- پروفایل + خروج برای کاربران لاگین‌شده
- Backdrop dark با کلیک → بسته می‌شه
- `expandedCats` reset on close

Registered in `DefaultLayout.vue`.

---

### Product Form Fixes — Admin ✅

**`buildDto` in `ProductFormView.vue`**
| Field | Bug | Fix |
|-------|-----|-----|
| `images` | آبجکت `{ original: { url } }` می‌فرستاد | `.map(img => img?.original?.url \|\| img?.url \|\| img).filter(Boolean)` |
| `attributes` | `{ رنگ: 'مشکی' }` (object) می‌فرستاد | `Object.entries(v.attributes).map(([key, value]) => ({ key, value }))` |
| `sku` | `v.sku?.trim() \|\| undefined` → `undefined` وقتی خالی | `v.sku?.trim() \|\| ''` |
| `brand` | در DTO نبود | `brand: form.brandId \|\| undefined` |

**`fillForm` in `ProductFormView.vue`**
- `v.attributes` از آرایه `[{key, value}]` → object `{ key: value }` تبدیل می‌شه
- `form.brandId = p.brand?._id ?? p.brand ?? ''`

---

### Backend Product Fixes ✅

**Variant schema & DTO — sku optional**
- `variant.schema.ts`: `@Prop({ required: true })` → `@Prop({ default: '' })`
- `create-variant.dto.ts`: `@IsString() sku` → `@IsOptional() @IsString() sku?`
- Reason: empty string `''` passed DTO validation but failed Mongoose `required: true` → 500

**Product service create — error handling**
- Added `try/catch` around `productModel.create()` → Mongoose `ValidationError` → `BadRequestException` (400)
- `brand` field: explicit `new Types.ObjectId(dto.brand)` conversion

**Admin product list — `adminFindAll`**
- Added `.populate('category', 'name slug')` — category name was not shown in admin products table
- Added `search` param: `$or: [{ name: regex }, { tags: regex }]`
- Added `sort` param with sort map

**Sort map extended**
Added to both `findAll` and `adminFindAll`:
```
bestseller → { soldCount: -1 }
discount   → { comparePrice: -1, minPrice: 1 }
```

**Category filter accepts slug OR ObjectId**
- `ProductQueryDto`: `@IsMongoId()` → `@IsString()` on `category`
- New `resolveCategoryId(str)` helper: if valid ObjectId → use directly; else → `findOne({ slug })` lookup
- CategoryModel injected into ProductService via ProductModule
- Fixes: `category=sunglasses` now works without needing to look up the ID on frontend

---

### Frontend Product Listing Fixes ✅ (storein-front)

**`sortBy` → `sort` everywhere**
`forbidNonWhitelisted: true` rejected `sortBy` as an unknown field. Fixed in:
- `product.store.js` (`fetchProducts`, `toQueryParams`, `fromQueryParams`)
- `HomeView.vue` (`fetchSection` calls + link URLs)
- `FlashSale.vue` (direct `productService.getAll` call + RouterLink URL)
- `SearchView.vue`

**`data?.items` → `data?.products ?? data?.items`**
Backend returns `{ products, total, page, totalPages }` not `{ items }`. Fixed in:
- `product.store.js`
- `HomeView.vue`
- `FlashSale.vue`
- `SearchView.vue`

**`BaseProductCard` — image format**
Images stored as string URLs `["http://..."]` but card read `image.url` (object format).
Fix: `typeof img === 'string' ? img : img.thumbnail || img.url`

**Admin products list params**
- `sortBy` → `sort`
- `categoryId` → `category`
- `data?.items` → `data?.products`

---

### User Management Fix ✅ (storein-admin)

`UsersView` was showing 0 users despite 2 users in DB.
Root cause: `GET /users` returns `{ users, total }` — admin view was reading `data?.users` correctly but the backend assigns admin token separately from store token.

Fix: The admin login flow was completely rewritten (see Auth Fixes above) — after that, users loaded correctly.

---

## Session 3 — Storefront Views + Admin Fix + Logging System (2026-06-08)

---

### Cart Module — variantId + slug Fixes ✅

**Problem:** `POST /cart/items` returned 400 — `variantId` was not being sent.

**Root cause:** `cart.service.js` called `addItem(productId, quantity)` — `variantId` was never forwarded to the backend. The `AddToCartDto` requires `variantId`.

**Backend fix — `cart.interface.ts`:**
Added `slug` field to `CartItem` interface (required for RouterLink in CartView):
```ts
export interface CartItem {
  productId: string; variantId: string; sku: string;
  name: string; slug: string; thumbnail: string | null;
  price: number; comparePrice: number | null;
  quantity: number; stock: number;
  attributes: { key: string; value: string }[];
}
```

**Backend fix — `cart.service.ts`:**
- `.select('name slug thumbnail variants')` — added `slug` to DB projection
- `addItem`: stores `slug: product.slug` in the Redis cart item

**Backend fix — `product.service.ts`:**
Added `variants` to public `findAll` select so list-view cards have variant IDs available for add-to-cart.

**Frontend fix — `cart.service.js`:**
```js
addItem:    (productId, variantId, quantity) => http.post('/cart/items', { productId, variantId, quantity }),
updateItem: (productId, variantId, quantity) => http.patch(`/cart/items/${productId}`, { variantId, quantity }),
removeItem: (productId, variantId)           => http.delete(`/cart/items/${productId}/${variantId}`),
```

**Frontend fix — `cart.store.js`:**
Updated function signatures to pass `variantId` through all cart operations.

**All add-to-cart call sites updated:**
`ProductInfo.vue`, `RelatedProducts.vue`, `ProductGrid.vue`, `FlashSale.vue`, `ProductRow.vue` — all use `product.variants?.find(v => v.stock > 0 && v.isActive !== false) ?? product.variants?.[0]` with null guard.

**Redis flush required** after backend schema change to drop old items missing `slug`.

---

### CartView ✅ (storein-front)

Full implementation of `/cart` replacing the stub.

**Features:**
- 2-column layout: items list (lg:col-span-2) + order summary sidebar
- Quantity stepper (+/−) with min=1, max=stock
- Remove item with per-row spinner during async delete
- Inline clear-all confirm (no modal) — dismiss on cancel
- Subtotal + savings (comparePrice difference) calculations
- Trust badges strip (ضمانت اصالت / تحویل سریع / پرداخت امن / ۷ روز مرجوعی)
- Skeleton loading state (3 cards) during fetch
- Empty state with `BaseEmpty` + RouterLink to products
- `TransitionGroup` list animations on add/remove
- `component :is` guard: uses `RouterLink` when `item.slug` exists, falls back to `div` for old cart items
- Uses `item.thumbnail` (not `item.image`)
- Checkout button → `/checkout`

---

### FlashSale Fix ✅ (storein-front)

**Problem:** `handleAddToCart` in `FlashSale.vue` tried to access `product.variants[0]._id` but `findAll` didn't return `variants`.

**Fix:** Added `variants` to `product.service.ts` public `findAll` select (backend). Added null guard in `FlashSale.vue`: `const variant = product.variants?.find(...) ?? product.variants?.[0]`. Same fix applied to `ProductRow.vue` and `ProductGrid.vue`.

---

### ProfileView ✅ (storein-front)

Full implementation of `/user/profile` replacing the stub.

**Features:**
- Sidebar: avatar initials circle, full name, phone, nav links (پروفایل / سفارش‌ها / علاقه‌مندی‌ها / آدرس‌ها), logout button
- Edit form: `firstName`, `lastName`, `email` with dirty-state check (save button disabled until changed)
- Account stats cards: سفارش‌ها / علاقه‌مندی‌ها / آدرس‌ها with RouterLink
- Quick action tiles grid
- `onMounted(() => authStore.fetchProfile())` to keep data fresh

**`user.service.js` fix:**
Wrong endpoints corrected:
```js
getProfile:    () => http.get('/users/me'),
updateProfile: (data) => http.patch('/users/me', data),
addAddress:    (data) => http.post('/users/me/addresses', data),
updateAddress: (id, data) => http.patch(`/users/me/addresses/${id}`, data),
deleteAddress: (id) => http.delete(`/users/me/addresses/${id}`),
setDefault:    (id) => http.patch(`/users/me/addresses/${id}/default`),
```

---

### OrdersView + OrderDetailView ✅ (storein-front)

New file: `src/services/order.service.js`:
```js
export const orderService = {
  getMyOrders: (params) => http.get('/orders/my', { params }),
  getMyOrder:  (id)     => http.get(`/orders/my/${id}`),
  cancelOrder: (id)     => http.patch(`/orders/my/${id}/cancel`),
}
```

**`OrdersView` features:**
- Status filter tabs (همه / در انتظار / تایید شده / ارسال شده / تحویل شده / لغو شده)
- Order cards with thumbnail strip (up to 3 images + count overflow)
- Status badge (color-coded), order number, date, item count, total
- Cancel dialog via `<Teleport to="body">`
- Pagination via `BasePagination`

**`OrderDetailView` features:**
- 5-step visual status stepper (pending→confirmed→processing→shipped→delivered)
- Items list with image/name/variant attrs/qty/price
- Financial summary (subtotal / discount / total)
- Shipping address card
- Inline cancel button with confirm dialog (only when status=pending)

---

### FavoritesView ✅ (storein-front)

Full implementation of `/user/favorites`.

**Features:**
- Responsive grid using `BaseProductCard` with `wishlist=true`
- Remove overlay on hover with heart icon button
- Clear all button with inline confirm
- `handleAddToCart`: navigates to product detail page (wishlist response has no variants)
- Pagination support
- `wishlist.service.js` updated: `getAll(params)` now accepts `{ page, limit }` params

---

### AddressesView ✅ (storein-front)

Full implementation of `/user/addresses`.

**Features:**
- Address cards grid with «پیش‌فرض» badge
- Set-default, edit, delete actions per card
- Bottom-sheet modal (Teleport) for create/edit form
- Full form fields: title (preset buttons: منزل/محل کار/سایر), province, city, street, detail, postalCode, recipientName, recipientPhone
- Phone validation: `/^(\+98|0)?9\d{9}$/`, postalCode: `/^\d{10}$/`
- `isDefault` CSS toggle (no checkbox)
- Delete confirm dialog
- All mutations also update `authStore.user.addresses` to keep profile data in sync

---

### Admin ProductFormView — Image Preview Fix ✅

**Problem:** Edit mode showed blank image previews despite images saved in DB.

**Two bugs found:**

**Bug 1 — `ImageUploader.vue`** didn't handle string URL format from DB:
Added `resolveUrl(img)` function handling all three shapes:
```js
function resolveUrl(img) {
  if (!img) return ''
  if (typeof img === 'string') return img                           // DB string
  if (img.thumbnail?.url) return img.thumbnail.url                 // upload API
  if (typeof img.thumbnail === 'string' && img.thumbnail) return img.thumbnail
  if (img.url) return img.url                                       // normalized
  if (img.original?.url) return img.original.url
  return ''
}
```

**Bug 2 — `ProductFormView.vue` `fillForm()`:** DB images are raw strings, but `ImageUploader` expected objects.
Fix: normalize strings to objects on load:
```js
form.images = (p.images ?? []).map(img =>
  typeof img === 'string' ? { url: img, thumbnail: img } : img
)
```

Also fixed `buildDto` thumbnail extraction to handle all image shape variants.

---

### Color Module ✅

New full-stack color management feature.

**Backend — `storein/src/modules/color/`**
| File | Purpose |
|------|---------|
| `entities/color.schema.ts` | Color schema: name, hex, isActive |
| `dto/create-color.dto.ts` | Create DTO |
| `dto/update-color.dto.ts` | Update DTO (PartialType) |
| `color.service.ts` | CRUD |
| `color.controller.ts` | GET public (all active), GET/POST/PATCH/DELETE admin |
| `color.module.ts` | Registered in AppModule |

**Frontend**
- `storein-front/src/services/color.service.js` — `getAll()` → `/colors`
- `ProductInfo.vue` — color swatches fetched from API instead of static map

**Bug fixes for color/brand endpoints:**
- `@UseGuards(JwtAuthGuard)` removed from class level on `ColorController` and `BrandController`; `@Public()` added only to public GET methods — prevented 403 on unauthenticated GET requests

---

### Logging System ✅

Complete structured logging across all three projects. Committed as `f95627d`.

#### Backend (`storein/`) — Winston

**New packages:** `winston`, `winston-daily-rotate-file`, `nest-winston`, `uuid`, `@types/uuid`

**New files:**
| File | Purpose |
|------|---------|
| `src/common/logger/logger.module.ts` | Global Winston module — console (colorized) + DailyRotateFile transports |
| `src/common/logger/app-logger.service.ts` | Injectable Transient logger — `setContext()`, `log/info/warn/error/debug()` |
| `src/common/middleware/request-id.middleware.ts` | Assigns UUID to every request; sets `x-request-id` response header |
| `src/common/middleware/http-logger.middleware.ts` | Logs every request/response: method, url, statusCode, duration; slow request warn (>2s) |
| `src/common/interceptors/logging.interceptor.ts` | Catches handler errors; warns on slow handlers (>1s) |

**Updated files:**
| File | Change |
|------|--------|
| `src/common/filters/http-exception.filter.ts` | 4xx logged as `warn`, 5xx as `error` with stack; `sanitizeBody()` removes passwords/OTPs/tokens |
| `src/app.module.ts` | `LoggerModule` added to imports; `RequestIdMiddleware` + `HttpLoggerMiddleware` wired globally |
| `src/main.ts` | `bufferLogs: true`, `app.useLogger(WINSTON_MODULE_NEST_PROVIDER)`, global filter+interceptor injected with logger via `app.get()` |
| `src/modules/auth/auth.service.ts` | Phone numbers masked in all log calls: `phone.slice(0,-4) + '****'` |
| `src/modules/order/order.service.ts` | Logs: order created (orderId, total, itemCount), order cancelled, status updated by admin |
| `src/modules/order/order.module.ts` | `AppLoggerService` added to providers |
| `src/modules/payment/payment.service.ts` | Logs: payment initiated, verification failed (warn), verification success |
| `src/modules/payment/payment.module.ts` | `AppLoggerService` added to providers |

**Log files (auto-created in `storein/logs/`, git-ignored):**
| File | Content | Retention |
|------|---------|-----------|
| `error-YYYY-MM-DD.log` | Errors only | 30 days |
| `combined-YYYY-MM-DD.log` | All levels | 14 days |

Log rotation: daily, gzip compressed, max 20MB/50MB per file.

**Log entry format (JSON in files, colorized in console):**
```json
{
  "timestamp": "2026-06-08 11:33:11.108",
  "level": "info",
  "context": "HTTP",
  "message": "Response Sent",
  "requestId": "46d5fc98-...",
  "method": "GET",
  "url": "/api/v1/products",
  "statusCode": 200,
  "duration": "11ms"
}
```

**requestId flow:** Every request gets a UUID via `RequestIdMiddleware` → same ID in HTTP log, handler error log, and exception filter log → traceable end-to-end.

**Security:** `sanitizeBody()` strips `password`, `token`, `secret`, `code`, `otp` fields. Phone numbers always masked last 4 digits.

#### Frontend — `storein-front/` + `storein-admin/`

**New files:**
| File | Purpose |
|------|---------|
| `src/utils/logger.js` | Buffered logger (last 50 errors in memory); level-filtered by env (dev: debug+, prod: warn+) |

**Updated files:**
| File | Change |
|------|--------|
| `src/services/http.service.js` | `apiError()` on all API failures; slow-call warn (>3s); network error detection; request `startTime` in metadata |
| `src/main.js` | `app.config.errorHandler` (Vue component crashes); `warnHandler` (dev only); `unhandledrejection`; `window.error`; `router.onError` |

**Admin uses `admin_token` key; storefront uses `access_token` key.**

**Development usage:**
```js
import { logger } from '@/utils/logger'
console.table(logger.getErrors())  // see last 50 errors
logger.clearErrors()
```

---

## Frontend Status Summary (2026-06-08)

| View | Route | Status |
|------|-------|--------|
| `HomeView` | `/` | ✅ Full |
| `ProductListView` | `/products`, `/category/:slug` | ✅ Full |
| `SearchView` | `/search` | ✅ Full |
| `ProductDetailView` | `/product/:slug` | ✅ Full |
| `LoginView` | `/auth/login` | ✅ Full |
| `OtpView` | `/auth/otp` | ✅ Full |
| `CartView` | `/cart` | ✅ Full |
| `ProfileView` | `/user/profile` | ✅ Full |
| `OrdersView` | `/user/orders` | ✅ Full |
| `OrderDetailView` | `/user/orders/:id` | ✅ Full |
| `FavoritesView` | `/user/favorites` | ✅ Full |
| `AddressesView` | `/user/addresses` | ✅ Full |
| `CheckoutView` | `/checkout` | 🔲 Stub — pending |

**Remaining:** `CheckoutView` (address selection + payment integration).

---

---

## Session 4 — Banner Module, Settings Module, Three-Tier RBAC, User List Fix (2026-06-08)

---

### Banner Module ✅ (backend)

New module for managing hero slider + two-column promo card banners.

**New files — `storein/src/modules/banner/`**

| File | Purpose |
|------|---------|
| `entities/banner.schema.ts` | Banner schema: title, eyebrow, subtitle, cta, ctaLink, bgFrom, bgTo, accent, imageUrl, glasses, `type: 'hero'\|'promo'`, isActive, sortOrder |
| `dto/create-banner.dto.ts` | Create DTO with optional `type` field |
| `dto/update-banner.dto.ts` | Update DTO (PartialType) |
| `dto/reorder-banners.dto.ts` | `{ ids: string[] }` for bulk sort-order update |
| `banner.service.ts` | Full service with AppLoggerService: findActive (hero only), findActivePromo (promo only), findAll (admin), create (per-type sortOrder count), update, remove, reorder (bulkWrite), toggleActive |
| `banner.controller.ts` | Routes in static-before-dynamic order |
| `banner.module.ts` | Providers: BannerService, AppLoggerService |
| `banner.service.spec.ts` | 35 tests — all methods, chainLean pattern, per-type counting, reorder, toggle |

**Endpoints**

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/banners` | Public | اسلایدرهای فعال (hero) |
| GET | `/api/v1/banners/promo` | Public | بنرهای ویژه فعال (promo) |
| GET | `/api/v1/banners/admin/all` | Admin | همه بنرها |
| POST | `/api/v1/banners` | Admin | ایجاد |
| PATCH | `/api/v1/banners/reorder` | Admin | تغییر ترتیب (bulkWrite) |
| PATCH | `/api/v1/banners/:id/toggle` | Admin | فعال/غیرفعال |
| PATCH | `/api/v1/banners/:id` | Admin | ویرایش |
| DELETE | `/api/v1/banners/:id` | Admin | حذف |

**Key decisions:**
- `type: 'hero' | 'promo'` field on single schema — no separate collection
- `sortOrder` counted per-type via `countDocuments({ type })` — hero and promo have independent order
- Route ordering: `/promo`, `/reorder`, `/admin/all` declared before `/:id` to avoid catch-all conflict

---

### Settings Module ✅ (backend)

New module for site-wide settings editable by admin only.

**New files — `storein/src/modules/settings/`**

| File | Purpose |
|------|---------|
| `entities/site-settings.schema.ts` | Singleton schema: `_key: 'default'`, siteName, tagline, logoUrl, faviconUrl, description, keywords, ogImage, SocialLinks (6 platforms), footerTagline, footerCopyright, footerLinks[], phone, email, address |
| `dto/update-settings.dto.ts` | All-optional DTO with MaxLength, IsEmail, ValidateNested for social and footerLinks |
| `settings.service.ts` | `findSettings()` — bootstrap on first access; `updateSettings()` — findOneAndUpdate with upsert |
| `settings.controller.ts` | `GET` public (storefront); `PATCH` SuperAdminGuard only |
| `settings.module.ts` | Providers: SettingsService, AppLoggerService |
| `settings.service.spec.ts` | 16 tests — bootstrap log, no-log on cache hit, upsert options, field counts in log |

**Updated:** `storein/src/app.module.ts` — SettingsModule imported.

**Updated:** `storage-provider.abstract.ts` — `'logos'` added to UploadFolder type.

**Key decisions:**
- `_key: 'default'` with unique index — one document, no ID lookups
- `findOneAndUpdate` with `{ upsert: true }` — idempotent, safe first-run
- `PATCH` uses `SuperAdminGuard` not `AdminGuard` — managers cannot edit site settings

---

### BannersView ✅ (admin panel)

**New files:**
- `storein-admin/src/services/banner.service.js` — getAll, create, update, remove, toggleActive, reorder
- `storein-admin/src/views/banners/BannersView.vue` — two-tab banner management

**Features:**
- Two tabs: «اسلایدر اصلی» (hero) and «بنرهای ویژه» (promo) with per-tab count badges
- `openCreate()` auto-sets `form.type` to the active tab
- Modal with dual live preview — hero (full-width slider style) vs promo (half-width card style)
- Promo form hides `accent` color and `subtitle` fields (unused in promo layout)
- HTML5 drag-and-drop reorder — operates on filtered subset only; reconstructs `allBanners` preserving other-type order on drop
- Router: `/banners` route added; Sidebar: «بنرها» 🖼 in فروشگاه group

---

### SettingsView ✅ (admin panel)

**New files:**
- `storein-admin/src/services/settings.service.js` — get, update
- `storein-admin/src/views/settings/SettingsView.vue` — 5-tab settings editor

**Features:**
- Tab 1 — عمومی: siteName, tagline, logo/favicon upload (folder: `logos`)
- Tab 2 — سئو: description, keywords, ogImage + live Google preview card
- Tab 3 — شبکه‌های اجتماعی: Instagram, Telegram, WhatsApp, Twitter, LinkedIn, YouTube
- Tab 4 — فوتر: tagline, copyright, dynamic footerLinks (add/remove rows)
- Tab 5 — تماس: phone, email, address
- `dirty` computed: `JSON.stringify(form) !== savedSnapshot` — save button shown only when changed
- Sticky save bar with «بازگردانی» (revert to saved) button
- Router: `/settings` route added; Sidebar: «تنظیمات سایت» ⚙️ in مدیریت group

---

### Storefront — Banner + Settings Integration ✅ (storein-front)

**New files:**
- `src/services/banner.service.js` — `getActive()` → `/banners`, `getActivePromo()` → `/banners/promo`
- `src/services/settings.service.js` — `getSettings()` → `/settings`
- `src/stores/settings.store.js` — Pinia store with all settings as computed accessors + fallbacks; fetched once on app mount
- `src/composables/useHead.js` — `useSiteHead(settingsRef)` composable using `watchEffect` to update `document.title`, meta description/keywords, og:title/description/image, favicon

**Updated files:**
- `src/App.vue` — `storeToRefs(settingsStore)` to get reactive Ref; `useSiteHead(settings)` called here; `fetchSettings()` on mount
- `src/components/layout/AppFooter.vue` — fully dynamic: logo (img or siteName text), social icons (v-if per platform), footerLinks from store with static fallback, phone/email with fallback, `footerCopyright © currentYear`
- `src/views/home/components/HeroBanner.vue` — fetches `GET /banners` on mount; falls back to 3 static slides; supports `imageUrl` background
- `src/views/home/components/SpecialBanner.vue` — fetches `GET /banners/promo` on mount; falls back to 2 static cards; supports `imageUrl`

**Key decisions:**
- `storeToRefs(store)` required to pass Pinia state as reactive `Ref` to `watchEffect` inside composable — direct `store.settings` is unwrapped
- `useSiteHead` uses a single `watchEffect` watching `settings.value` — all meta updates in one place

---

### Three-Tier RBAC — Admin / Manager / User ✅

**User schema update** (`storein/src/modules/user/entities/user.schema.ts`):
```typescript
export enum UserRole {
  USER    = 'user',
  MANAGER = 'manager',
  ADMIN   = 'admin',
}
// New field added to User class:
@Prop({ enum: Object.values(UserRole), default: UserRole.USER })
role: string;
```
`isAdmin: boolean` kept for backward compatibility — synced on every role change.

**Guard changes:**

| Guard | File | Behavior |
|-------|------|---------|
| `AdminGuard` (updated) | `common/guards/admin.guard.ts` | Allows `isAdmin === true` **OR** `role === 'manager'` |
| `SuperAdminGuard` (new) | `common/guards/super-admin.guard.ts` | Allows `isAdmin === true` only |

**Applied to:**
- `PATCH /api/v1/settings` → `SuperAdminGuard` (managers cannot edit site settings)
- `PATCH /api/v1/admin/users/:id/role` → `SuperAdminGuard` (class-level `AdminGuard` + method-level `SuperAdminGuard`)
- `PATCH /api/v1/admin/users/:id/promote` → `SuperAdminGuard`
- `PATCH /api/v1/admin/users/:id/demote` → `SuperAdminGuard`

**`AdminService.setUserRole(userId, role)`** (new method):
- Validates role against `UserRole` enum
- Sets both `role` and `isAdmin` atomically: `isAdmin = role === 'admin'`
- `promoteToAdmin` and `demoteFromAdmin` now delegate to `setUserRole`

**New endpoint:** `PATCH /api/v1/admin/users/:id/role` with `{ role: 'user'|'manager'|'admin' }` body.

**Admin panel updates:**

| File | Change |
|------|--------|
| `stores/auth.store.js` | Added `isAdmin` and `isManager` computed; `isLoggedIn` allows `role === 'manager'`; login/fetchProfile allow manager role |
| `components/layout/AdminSidebar.vue` | `navGroups` is now a `computed` — Settings link hidden for managers; role badge (ادمین/مدیر) shown in sidebar footer with phone |
| `router/index.js` | `meta: { adminOnly: true }` on `/settings` route; `beforeEach` redirects managers to dashboard if they try to access admin-only routes |

**Role permission matrix:**

| Feature | User | Manager | Admin |
|---------|------|---------|-------|
| Products, Categories, Brands, Colors | — | ✅ | ✅ |
| Orders management | — | ✅ | ✅ |
| Reviews, Discounts, Banners | — | ✅ | ✅ |
| Users list/view | — | ✅ | ✅ |
| Site Settings (edit) | — | ❌ | ✅ |
| User role management | — | ❌ | ✅ |

---

### Test Fixes ✅

All 203 backend tests pass after this session.

| File | Fix |
|------|-----|
| `payment.service.spec.ts` | Added `AppLoggerService` import + mock to providers |
| `order.service.spec.ts` | Same fix |
| `product.service.spec.ts` | Added `CategoryModel` and `ColorModel` mocks (ProductService injects all three) |
| `admin.service.spec.ts` | Updated `promoteToAdmin` assertion to match new `{ role, isAdmin }` payload |
| `user.service.spec.ts` | Updated `toggleActive` → `toggleBlock`; added `isBlocked` assertion |

```
Test Suites: 19 passed, 19 total
Tests:       203 passed, 203 total
```

---

### User List API Fix ✅

Three bugs fixed in the admin users list:

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| «کاربری یافت نشد» despite 2 users | Backend returned `{ users, total }` but frontend read `data?.items` | Service now returns `{ items, total }` |
| `isBlocked` missing from user objects | Schema stores `isActive: boolean`; frontend expected `isBlocked` | Service maps `isBlocked = !isActive` on every returned user |
| Block/unblock call failed (404) | Frontend called `PATCH /users/:id/block` but backend had `toggle-active` | Renamed method to `toggleBlock`, endpoint to `/block` |

Additionally:
- `search` query param now filters by phone/firstName/lastName regex
- `isBlocked=true/false` query param now filters by `isActive: false/true`
- Users sorted by `createdAt: -1` (newest first)

---

## Session 5 — Dashboard Fix, Blog Module, Section Color Theming (2026-06-08)

---

### Dashboard Stats Fix ✅ (storein-admin)

**Problem:** Stat cards (کاربران / محصولات / سفارشات / درآمد) showed 0 on the dashboard.

**Root cause:** `DashboardView` expected `stats.overview.totalUsers` etc., but `GET /admin/dashboard` returns `{ users: { total }, products: { total }, orders: { ... }, revenue: { ... } }` — no `overview` key.

**Fix — `storein-admin/src/services/dashboard.service.js`:**
Added 4 new service methods:
```js
export const dashboardService = {
  getStats:        ()          => http.get('/admin/dashboard'),
  getRevenue:      (params)    => http.get('/admin/stats/revenue', { params }),
  getOrderStats:   ()          => http.get('/admin/stats/orders'),
  getRecentOrders: (limit=10)  => http.get('/admin/stats/recent-orders', { params: { limit } }),
  getTopProducts:  (limit=10)  => http.get('/admin/products/top-selling', { params: { limit } }),
}
```

**Fix — `storein-admin/src/views/dashboard/DashboardView.vue` — `loadStats()`:**
Rewrote to call all 5 endpoints in parallel with `Promise.allSettled` and map into the shape the template expects:
```js
const [dashRes, revenueRes, orderStatsRes, recentRes, topRes] = await Promise.allSettled([...])
stats.value = {
  overview: {
    totalRevenue:  dash.revenue?.allTime   ?? 0,
    monthRevenue:  dash.revenue?.thisMonth ?? 0,
    todayRevenue:  dash.revenue?.today     ?? 0,
    totalOrders:   dash.orders?.total      ?? 0,
    pendingOrders: dash.orders?.pending    ?? 0,
    todayOrders:   orderStats.today        ?? 0,
    totalUsers:    dash.users?.total       ?? 0,
    totalProducts: dash.products?.total    ?? 0,
  },
  revenueByDay:     revenue.byDay.map(d => ({ date: d.date, revenue: d.amount ?? 0, orders: 0 })),
  orderStatusStats: dash.orders ?? {},
  recentOrders:     Array.isArray(recent) ? recent : [],
  topProducts:      Array.isArray(top)    ? top    : [],
}
```

**Key decisions:**
- `Promise.allSettled` used instead of `Promise.all` — individual endpoint failures don't crash the entire dashboard
- `RevenueChart` expects `{ date, revenue }` but backend returns `{ date, amount }` — mapping layer in `loadStats` converts field name
- `stats.overview` shape kept intact — no template changes needed

---

### Blog Module ✅ (full-stack)

New content management feature: blog posts with draft/published/archived lifecycle.

#### Backend — `storein/src/modules/blog/`

| File | Purpose |
|------|---------|
| `entities/blog.schema.ts` | Blog schema: title, slug (unique, auto-generated), content, excerpt, featuredImage, author (ref User), tags[], status (draft/published/archived), viewCount, publishedAt |
| `dto/create-blog.dto.ts` | Create DTO: title, content, optional excerpt/featuredImage/tags/status/publishedAt |
| `dto/update-blog.dto.ts` | Update DTO (PartialType of CreateBlogDto) |
| `dto/blog-query.dto.ts` | Query DTO: page, limit, search, status, sortBy, tag |
| `blog.service.ts` | Full service: `findAll(query, adminMode)`, `findBySlug`, `findById`, `create`, `update`, `remove`, `incrementView`, `getPopularTags`, `uniqueSlug` private helper |
| `blog.controller.ts` | Public + admin endpoints |
| `blog.module.ts` | Imports MongooseModule, exports BlogService + MongooseModule |

**Endpoints**

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/blog` | Public | پست‌های منتشرشده با فیلتر/صفحه‌بندی |
| GET | `/api/v1/blog/tags` | Public | تگ‌های محبوب (حداکثر 20) |
| GET | `/api/v1/blog/slug/:slug` | Public | جزئیات پست + افزایش viewCount |
| GET | `/api/v1/blog/admin` | Admin | همه پست‌ها (شامل draft/archived) |
| GET | `/api/v1/blog/admin/:id` | Admin | جزئیات admin |
| POST | `/api/v1/blog` | Admin | ایجاد پست |
| PATCH | `/api/v1/blog/:id` | Admin | ویرایش |
| DELETE | `/api/v1/blog/:id` | Admin | حذف |

**Key decisions:**
- `slugify` تابع داخلی — هیچ dependency اضافه نشد
- `uniqueSlug` در صورت تکرار slug پسوند عددی اضافه می‌کند (-1, -2, ...)
- `adminMode=true` در `findAll` فیلتر status را برمی‌دارد تا ادمین همه پست‌ها را ببیند
- `Record<string, SortOrder>` برای sort (نه `Record<string, number>`) — Mongoose strict type
- `publishedAt` به صورت خودکار هنگام تغییر status به `published` ست می‌شود

**Updated:** `storein/src/app.module.ts` — `BlogModule` اضافه شد.

#### Admin Panel — `storein-admin/`

**New files:**

| File | Purpose |
|------|---------|
| `src/services/blog.service.js` | `getAll`, `getById`, `create`, `update`, `remove` — mapped to `/blog/admin` endpoints |
| `src/views/blog/BlogsView.vue` | لیست پست‌ها با فیلتر (search / status / sortBy)، جدول با thumbnail، نشانگر وضعیت، تگ‌ها، تعداد بازدید؛ دکمه‌های edit/delete/link-to-storefront |
| `src/views/blog/BlogFormView.vue` | فرم ایجاد/ویرایش: title + auto-slug، ویرایشگر HTML با toolbar (H2/H3/B/I/UL/OL/link/img/code/blockquote)، پیش‌نمایش، آپلود featured image، مدیریت تگ‌ها، پنل SEO preview، دو دکمه «پیش‌نویس» و «انتشار» |

**Auto-slug logic:**
- هنگام تایپ title، slug به صورت خودکار از title ساخته می‌شود
- به محض اینکه کاربر slug را دستی ویرایش کند، auto-generation متوقف می‌شود
- `useDebounceFn` از `@vueuse/core` برای debounce جستجو

**Updated files:**

| File | Change |
|------|--------|
| `src/router/index.js` | Routes: `/blog`, `/blog/create`, `/blog/:id/edit` با permission: `'blog'` |
| `src/components/layout/AdminSidebar.vue` | «بلاگ» 📝 به گروه فروشگاه اضافه شد |
| `src/utils/constants.js` | `{ key: 'blog', label: 'بلاگ', icon: '📝', group: 'محتوا' }` به `PANEL_PERMISSIONS` اضافه شد |

#### Storefront — `storein-front/`

**New files:**

| File | Purpose |
|------|---------|
| `src/services/blog.service.js` | `getAll(params)`, `getBySlug(slug)`, `getTags()` — public endpoints |
| `src/stores/blog.store.js` | Pinia store: `posts`, `post`, `tags`, `loading`, `total`, `totalPages`, `filters`؛ actions: `fetchPosts`, `fetchPostBySlug`, `fetchTags`, `resetFilters` |
| `src/views/blog/components/BlogCard.vue` | کارت پست: تصویر، تگ‌ها، عنوان (hover:text-brand)، خلاصه، نویسنده، تاریخ، تعداد بازدید |
| `src/views/blog/BlogListView.vue` | صفحه لیست: سایدبار (جستجو + مرتب‌سازی + تگ‌های محبوب)، گرید پست‌ها (1→2→3 ستون)، pagination، chips فیلتر فعال |
| `src/views/blog/BlogDetailView.vue` | صفحه جزئیات: تصویر hero (یا gradient header)، breadcrumb، meta (نویسنده/تاریخ/بازدید/زمان مطالعه)، محتوا با `v-html`، تگ‌ها، دکمه کپی لینک |

**`readTime` computed:** تعداد کلمات ÷ ۲۰۰ کلمه در دقیقه

**Updated files:**

| File | Change |
|------|--------|
| `src/router/index.js` | `/blog` (name: `blog`) و `/blog/:slug` (name: `blog-detail`) اضافه شد |
| `src/components/layout/AppHeaderNav.vue` | «بلاگ» به quickLinks اضافه شد؛ `isLinkActive` برای route‌های blog آپدیت شد |
| `src/components/layout/AppMobileDrawer.vue` | لینک بلاگ قبل از بخش دسته‌بندی‌ها اضافه شد |

---

### Theme Section Colors ✅ (full-stack)

قابلیت تنظیم رنگ navbar، footer سایت اصلی، و sidebar پنل ادمین به صورت مستقل.

#### Backend — Schema + DTO

**`storein/src/modules/settings/entities/site-settings.schema.ts`** — `ThemeSettings` class:
```typescript
// New fields added — empty string = use default CSS variable
@Prop({ default: '' }) navbarBg:     string;
@Prop({ default: '' }) navbarBorder: string;
@Prop({ default: '' }) footerBg:     string;
@Prop({ default: '' }) footerText:   string;
@Prop({ default: '' }) sidebarBg:    string;
```

**`storein/src/modules/settings/dto/update-settings.dto.ts`** — `ThemeDto` class:
```typescript
const HEX_OR_EMPTY = /^(#[0-9A-Fa-f]{6})?$/;  // allows '' (reset) or valid #RRGGBB
@IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) navbarBg?:     string;
@IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) navbarBorder?: string;
@IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) footerBg?:     string;
@IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) footerText?:   string;
@IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) sidebarBg?:    string;
```

#### Admin Sidebar Dynamic Color

**`storein-admin/src/composables/useAdminTheme.js`** (جدید):
```js
// Module-level singleton — shared across all useAdminTheme() calls
const sidebarBg = ref('')

async function init() {          // called once on App.vue mount
  const { data } = await http.get('/settings')
  apply(data?.theme)
}

function applyTheme(theme) { apply(theme) }  // called immediately after save

export function useAdminTheme() {
  return { sidebarBg, init, applyTheme }
}
```

**`storein-admin/src/App.vue`** — `init()` در `onMounted` فراخوانی می‌شود.

**`storein-admin/src/components/layout/AdminSidebar.vue`** — هر دو `<aside>` (desktop + mobile):
```html
:style="sidebarBg ? { backgroundColor: sidebarBg } : {}"
```

#### Storefront Navbar + Footer

**`storein-front/src/assets/styles/variables.css`** — متغیرهای footer اضافه شد:
```css
--color-footer-bg:    #111827;
--color-footer-text:  #D1D5DB;
--color-footer-muted: #9CA3AF;
```

**`storein-front/src/composables/useTheme.js`** — `applyFromSettings()` حالا 4 CSS var می‌سازد:
```js
if (theme.navbarBg)     root.setProperty('--color-header-bg',     theme.navbarBg)
if (theme.navbarBorder) root.setProperty('--color-header-border', theme.navbarBorder)
if (theme.footerBg)     root.setProperty('--color-footer-bg',     theme.footerBg)
if (theme.footerText)   root.setProperty('--color-footer-text',   theme.footerText)
```

**`storein-front/src/components/layout/AppFooter.vue`** — از CSS vars به جای کلاس‌های hardcoded Tailwind:
```html
<footer class="site-footer"
  :style="{ backgroundColor: 'var(--color-footer-bg)', color: 'var(--color-footer-text)' }">
```
```css
/* <style scoped> — CSS :deep() selectors با !important */
.site-footer :deep(.text-white)      { color: var(--color-footer-text) !important; }
.site-footer :deep(.text-gray-400)   { color: var(--color-footer-muted) !important; }
.site-footer :deep(.bg-gray-800)     { background-color: rgba(255,255,255,0.08) !important; }
.site-footer :deep(.border-gray-800) { border-color: rgba(255,255,255,0.1) !important; }
```

#### SettingsView Theme Tab UI

**`storein-admin/src/views/settings/SettingsView.vue`** — tab «تم سایت» یک card جدید اضافه شد:

```
کارت: رنگ‌بندی بخش‌های مختلف سایت
├── هدر / ناوبار
│   ├── color picker + input: navbarBg
│   ├── color picker + input: navbarBorder
│   └── mini-preview: نمایش navbar با رنگ انتخابی
├── فوتر
│   ├── color picker + input: footerBg
│   ├── color picker + input: footerText
│   └── mini-preview: نمایش footer با رنگ انتخابی
└── سایدبار ادمین
    ├── color picker + input: sidebarBg
    └── mini-preview: نمایش sidebar با رنگ انتخابی
```

هر بخش دارای دکمه «↺ پیش‌فرض» است که فقط وقتی مقدار ست شده نمایش داده می‌شود.

**Script section آپدیت‌ها:**

```js
const { applyTheme } = useAdminTheme()

// contrast helper — تعیین رنگ متن navbar preview
const navbarTextColor = computed(() => {
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255
  return lum > 0.5 ? '#1f2937' : '#f9fafb'
})

// emptyForm() — 5 فیلد جدید
theme: { ..., navbarBg: '', navbarBorder: '', footerBg: '', footerText: '', sidebarBg: '' }

// applyData() — 5 فیلد جدید از API response
// saveAll() — 5 فیلد جدید در DTO
// بعد از save: applyTheme(data.theme) — sidebar بلافاصله آپدیت می‌شود
```

**Key decisions:**
- Module-level singleton در `useAdminTheme` — state یک بار fetch می‌شود و بین همه component‌ها shared است؛ نیازی به Pinia نیست
- CSS `:deep()` با `!important` برای override کردن Tailwind classes hardcoded در template footer بدون نیاز به بازنویسی template
- `HEX_OR_EMPTY` regex در DTO — رشته خالی (`''`) معنای "برگرد به پیش‌فرض" دارد
- فقط اگر مقدار set شده باشد (`if (theme.navbarBg)`) CSS var ست می‌شود — مقادیر خالی CSS vars پیش‌فرض را حفظ می‌کنند
- Admin sidebar رنگ را فوری (بدون reload) بعد از save آپدیت می‌کند از طریق `applyTheme()` call

---

## Current Project Status (2026-06-08)

### Backend `storein/` — ✅ کامل

| Modules | Count |
|---------|-------|
| Core modules (Auth, User, Product, Category...) | 15 |
| Feature modules (Brand, Color, Banner, Settings, Blog) | 5 |
| Total tests | 203+ |
| API endpoints | ~130 |

### Admin Panel `storein-admin/` — ✅ کامل

| Section | Views | Status |
|---------|-------|--------|
| Auth (Login) | 1 | ✅ |
| Dashboard (Charts + KPIs) | 1 | ✅ |
| Products (List + Form) | 2 | ✅ |
| Categories | 1 | ✅ |
| Brands | 1 | ✅ |
| Colors | 1 | ✅ |
| Banners (Hero + Promo) | 1 | ✅ |
| Orders (List + Detail) | 2 | ✅ |
| Users (List + Detail) | 2 | ✅ |
| Reviews | 1 | ✅ |
| Discounts | 1 | ✅ |
| Blog (List + Form) | 2 | ✅ |
| Settings (6 tabs + Theme Colors) | 1 | ✅ |

### Storefront `storein-front/` — ✅ تقریباً کامل

| View | Route | Status |
|------|-------|--------|
| `HomeView` | `/` | ✅ |
| `ProductListView` | `/products`, `/category/:slug` | ✅ |
| `SearchView` | `/search` | ✅ |
| `ProductDetailView` | `/product/:slug` | ✅ |
| `LoginView` + `OtpView` | `/auth/login`, `/auth/otp` | ✅ |
| `CartView` | `/cart` | ✅ |
| `ProfileView` | `/user/profile` | ✅ |
| `OrdersView` + `OrderDetailView` | `/user/orders` | ✅ |
| `FavoritesView` | `/user/favorites` | ✅ |
| `AddressesView` | `/user/addresses` | ✅ |
| `BlogListView` | `/blog` | ✅ |
| `BlogDetailView` | `/blog/:slug` | ✅ |
| `CheckoutView` | `/checkout` | 🔲 Stub |

**Remaining:** `CheckoutView` — انتخاب آدرس + انتخاب روش پرداخت + ثبت سفارش.

---

## GitHub

Repository: `https://github.com/sabervalimohamadi/storein-glasses.git`  
Branch: `master`  
Latest commit: `b5e6d77` — Session 5: Blog module, dashboard fix, section color theming
