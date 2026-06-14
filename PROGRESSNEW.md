# Storein — Project Progress Log

> **Stack:** NestJS (backend) · Vue 3 (storein-front) · Vue 3 (storein-admin)  
> **Database:** MongoDB + Redis · **Auth:** JWT (access + refresh) + HttpOnly cookie  
> **Tests:** 353 backend (Jest) · 107 storein-front (Vitest) · 63 storein-admin (Vitest)  
> **Pre-existing failures:** 12 (category.service × 10, review.service × 2) — unchanged throughout

---

## Test Matrix

| Project | Framework | Files | Tests | Pass | Fail |
|---------|-----------|-------|-------|------|------|
| `storein` (backend) | Jest | 28 | 353 | 341 | 12 ¹ |
| `storein-front` | Vitest | 10 | 107 | 107 | 0 |
| `storein-admin` | Vitest | 4 | 63 | 63 | 0 |

> ¹ Pre-existing in `category.service.spec.ts` (10) and `review.service.spec.ts` (2)

---

## Session 1 — Initial Commit (2026-06-01)

**Commit:** `d4eab14` · Initial commit — Storein eyewear store  
**Commit:** `552c278` · Add backend (NestJS) — 15 modules, 152 tests

### What was built

Full-stack eyewear e-commerce from scratch.

**Backend (`storein/`) — NestJS:**
- 15 modules: Auth, User, Product, Category, Brand, Cart, Order, Payment, Discount, Review, Search, Wishlist, Upload, Settings, Notification
- JWT authentication with OTP login (phone-based)
- MongoDB schemas with Mongoose
- 152 unit tests passing

**Frontend (`storein-front/`) — Vue 3 + Vite:**
- Phase 1–3 pages: Home, Products listing, Product detail, Cart, Checkout, Auth (OTP), User dashboard
- Pinia stores: auth, cart, wishlist, product, settings, ui
- Axios HTTP service with response envelope unwrapping `{ success, data }` → `data`

---

## Session 2 — Brand Module, Dark Mode, Admin Panel (2026-06-04)

**Commits:** `0ab814b`, `a4804c3`

### Brand Module (full-stack)
- Backend: `BrandModule` — CRUD with slug generation, public list endpoint
- Admin: `BrandListView`, `BrandFormView` — create/edit/delete brands
- Product form: brand dropdown linked to `GET /brands`

### Admin Panel Foundation
- `storein-admin/` bootstrapped with Vue 3 + Vite + Tailwind
- Router, Pinia, Axios http service
- Login/OTP flow, JWT storage in `admin_token` localStorage

### Bug Fixes
- `BaseProductCard` crash: `ref(fn)()` → `ref((fn)())` — wrong ref initialization

---

## Session 3 — Product UI, Color Module (2026-06-06)

**Commits:** `e31d5e3`, `8fb16da`, `fe7a22a`, `eed7477`, `fd0a032`, `01f8729`, `42b90b3`, `3db0a0b`, `ba4253`, `1653796`, `0cda5a8`, `1daa12d`

### Product Listing Fixes
- `inStock` field missing from product card → added from `totalStock`
- Placeholder image when no thumbnail
- Product images not showing: wrong property access on string[] images
- `ProductGallery`: normalize `string[]` images to `{ url, thumbnail }` objects
- Duplicate `style` attribute crashing product detail page
- Gallery nav arrows dark mode: white bg+dark icon → black/30+white icon
- Image lightbox on gallery click

### Color Module (full-stack)
- Backend: `ColorModule` — CRUD (name, hex code), public list endpoint `GET /colors`
- Admin: `ColorListView`, color picker in variant form
- Product detail: color swatches fetched from API with name labels
- Color picker dropdown: `click.stop` + `data-color-picker` selector fix
- `color.service.js`: named `{ http }` → default `http` import fix

### Auth Guard Fix
- `AdminGuard` was blocking `@Public()` routes at class level → per-method guards

### Logging System
- `AppLoggerService` injected across all backend services with structured JSON logs
- Frontend: `logger` utility added to auth/cart/wishlist/product stores

---

## Session 4 — Banner, Settings, RBAC, Dark Mode (2026-06-08)

**Commits:** `f95627d`, `ec7d702`, `19d72ab`, `451d6ae`, `0717cf7`, `1b6f158`

### Banner Module (full-stack)
- Backend: `BannerModule` — CRUD with active/promo filter, image URL, link, position
- Public endpoints: `GET /banners`, `GET /banners/promo`
- Admin: `BannerListView`, `BannerFormView`
- Frontend: `HeroBanner`, `SpecialBanner` components fetching from API

### Settings Module (full-stack)
- Backend: `SiteSettingsSchema` — siteName, tagline, logo, favicon, social links, phone, email, address, footerLinks, theme preset, trustItems
- `GET /settings` (public), `PATCH /settings` (admin-only)
- Admin: `SettingsView` with all fields editable
- Frontend `useSettingsStore`: fetches on `App.vue` mount, all components reactive to DB settings

### Three-tier RBAC
- `isAdmin` + `role` fields on User schema
- `AdminGuard`: blocks non-admin users
- `ManagerGuard`: allows `role: 'manager'` in addition to `isAdmin`
- Admin user management with role assignment

### Admin Dark Mode (zero-flash)
- CSS variables toggled on `<html>` via `useAdminTheme` composable
- Theme saved to `localStorage`, applied before first render (no FOUC)
- All 5 toggle switches fixed: knob overflow, visual convention

### Bug Fixes
- Product image preview in admin list: `images[0].url` was `images[0]` (string)
- User list API: admin endpoint returning wrong data shape

---

## Session 5 — Blog Module, Dashboard, Audit Baseline (2026-06-08–09)

**Commits:** `6cac650`, `1b6f158`

### Blog Module (full-stack)
- Backend: `BlogModule` — CRUD, slug, published/draft status, tags, author
- Admin: `BlogListView`, `BlogFormView` with rich content editor
- Frontend: `BlogListView`, `BlogDetailView`

### Dashboard Fix
- Stats cards: connected to real API counts (orders, users, revenue, products)

### Coupon Validation Fix
- Checkout was optimistically accepting any coupon code
- Fixed: real `POST /discounts/validate` API call before proceeding

### IRANSans Fonts
- Self-hosted IRANSansWeb woff/woff2 added to `public/fonts/`
- Applied as primary Persian font across both frontends

---

## Session 6 — Full Audit: Logs + Tests (~230 new tests) (2026-06-12)

**Commit:** `73d1497` — Add complete audit: logs + tests across all 12 folders

### Backend Tests Added (~110 tests)

| Spec file | Tests |
|-----------|-------|
| `auth.controller.spec.ts` | 12 |
| `order.controller.spec.ts` | 10 |
| `payment.controller.spec.ts` | 8 |
| `product.controller.spec.ts` | 10 |
| `user.controller.spec.ts` | 8 |
| `review.controller.spec.ts` | 8 |
| `discount.controller.spec.ts` | 10 |
| `banner.service.spec.ts` | 8 |
| `search.service.spec.ts` | 8 |
| `settings.service.spec.ts` | 8 |
| `wishlist.service.spec.ts` | 10 |
| `notification.service.spec.ts` | 10 |

Fixed broken spec providers:
- `user.service.spec.ts`: missing `RefreshToken` model mock
- `review.service.spec.ts`: missing `Order` model mock
- `NotificationsGateway` mock added to `order.service.spec`

### Frontend Tests Added (~120 tests)

**storein-front** — Vitest + `@vue/test-utils` + jsdom:

| Test file | Tests |
|-----------|-------|
| `auth.store.test.js` | 12 |
| `cart.store.test.js` | 10 |
| `product.store.test.js` | 11 |
| `wishlist.store.test.js` | 8 |
| `ui.store.test.js` | 7 |
| `AppFooter.test.js` | 22 |
| `useApi.test.js` | 8 |
| `useTheme.test.js` | 8 |
| `formatters.test.js` | 12 |
| `validators.test.js` | 9 |

**storein-admin** — Vitest:

| Test file | Tests |
|-----------|-------|
| `auth.store.test.js` | 15 |
| `ui.store.test.js` | 10 |
| `formatters.test.js` | 19 |
| `BulkDiscountModal.test.js` | 19 |

### `AppFooter.test.js` — Notable: `vi.mock` hoisting fix
The footer test mocked `useSettingsStore` but hit a `vi.mock` hoisting issue:
- **Problem:** `vi.mock` factory referenced module-level `useSettingsStore` before init
- **Fix:** async factory with dynamic import:
  ```js
  vi.mock('@/stores/settings.store', async () => {
    const { defineStore } = await import('pinia')
    return { useSettingsStore: defineStore('settings', { state: () => ({ ... }) }) }
  })
  ```

### Logging Added (structured JSON)
- `AppLoggerService` with `log/warn/error/debug` and context prefix
- Injected into: `ProductService`, `ReviewService`, `DiscountService`, `UserService`, `AuthService`, `PaymentService`, `OrderService`
- Frontend stores: `logger.error(...)` calls in catch blocks across all stores

---

## Session 7 — BulkDiscountModal Redesign (2026-06-12–13)

**Commits:** `19cf34b`, `3a40b5b`, `ff741b3`

### BulkDiscountModal Redesign
- Navy gradient theme matching admin design language
- Live preview of discounted price per variant
- Batch update: one `PATCH /products/:id` call for all variants
- 19 tests: renders, applies, validates, resets

### Bug Fixes
- `markModified('variants')` missing after variant update — MongoDB wasn't saving changes
- Per-variant price display: was showing product-level price, fixed to variant price
- Syntax error: `discountModalBase` computed mixed `??` with `||` without parens

---

## Session 8 — AppFooter Redesign (2026-06-13)

**Commit:** `7352ec3`

### AppFooter — Navy Gradient Theme
- Background: `bg-gradient-to-br from-[#0A1628] to-[#1B2B4B]`
- Sections: site info + social links, quick links, contact info, trust badges
- Fully driven by `useSettingsStore` — all content from DB via Settings API
- RTL layout, Persian typography
- 22 tests covering all sections, conditional rendering, social links, trust badges

---

## Session 9 — Security Audit Remediation (2026-06-13)

**Commit:** `4381bde` — Fix all 16 audit issues: security, reliability, and code quality

An HTML audit report (rating C+) identified 18 issues across 5 severity levels.
All 16 actionable issues fixed.

### Critical (5 fixed)

**C1 — CORS: open to all origins**
```ts
// Before
app.enableCors({ origin: '*' })

// After
const allowedOrigins = configService.get<string[]>('app.allowedOrigins') ?? []
app.enableCors({ origin: allowedOrigins, credentials: true, methods: [...] })
```
- `ALLOWED_ORIGINS` env var (comma-separated), validated by Joi

**C2 — HTTP Security Headers (Helmet)**
```ts
app.use(helmet())  // X-Frame-Options, CSP, HSTS, X-Content-Type-Options
```

**C3 — OTP: Math.random → CSPRNG**
```ts
// Before
Math.floor(Math.random() * 9000) + 1000

// After
import { randomInt } from 'crypto'
Array.from({ length }, () => randomInt(0, 10)).join('')
```

**C4 — JWT: access token memory-only**
- Admin: `token = ref(null)` (was `localStorage.getItem('admin_token')`)
- `setTokenProvider()` pattern breaks circular dependency between http service and auth store
- On reload: `initAuth()` calls refresh endpoint to silently restore session

**C5 — Payment callback: env var not hardcoded**
```ts
this.defaultCallback = this.configService.get<string>('app.paymentCallbackUrl')!
```

### High (5 fixed)

**H1 — Brute-force on OTP verify (Redis counter)**
```ts
const verifyKey = `otp:verify:${phone}`
const attempts = await this.redis.incr(verifyKey)
if (attempts === 1) await this.redis.expire(verifyKey, 300)
if (attempts > 5) throw new BadRequestException('۵ دقیقه دیگر تلاش کنید')
```

**H2 — Global rate limiting (ThrottlerModule)**
```ts
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])
// + { provide: APP_GUARD, useClass: ThrottlerGuard }
```

**H3 — Refresh tokens: bcrypt hash before DB storage**
```ts
const hashed = await bcrypt.hash(refreshToken, 10)
await this.rtModel.create({ userId, token: hashed, ... })
// Lookup: for each candidate, bcrypt.compare(incomingToken, candidate.token)
```

**H4 — WebSocket CORS: from ConfigService**
```ts
// Gateway constructor
this.allowedOrigins = this.configService.get<string[]>('app.allowedOrigins') ?? []

// handleConnection: reject if origin not in allowedOrigins
```

**H5 — PaymentService: @InjectModel instead of db.model hack**
```ts
// Before
this.walletModel.db.model('User').findById(...)

// After
@InjectModel(User.name) private userModel: Model<UserDocument>
this.userModel.findById(...).select('phone').lean<UserDocument>()
```

### Medium (3 fixed)

**M1 — N+1 query in createFromCart → batch lookup**
```ts
// Before: for loop with productService.findById per item
// After:
const products = await this.productService.findManyByIds(productIds)
const productMap = new Map(products.map(p => [p._id.toString(), p]))
```

**M2 — v-html XSS in blog editor**
```js
import DOMPurify from 'dompurify'
// v-html="DOMPurify.sanitize(form.content || '')"
```

**M3 — uniqueSlug: while(true) capped**
```ts
// Before: while(true) { ... }
// After:
for (let i = 1; i <= 20; i++) { ... }
throw new BadRequestException('تولید slug پس از 20 تلاش ناموفق بود')
```

### Low (2 fixed)

**L1 — HydratedDocument typing** — removed `(user._id as any)` cast in `issueTokens`

**L2 — Swagger/OpenAPI** — added at `/api/docs` in non-production environments

### Tests Updated
- `auth.service.spec.ts`: `chainable()` helper for Mongoose `.select().lean()` chaining
- `payment.service.spec.ts`: new `userModel` + `ConfigService` mock providers
- `order.service.spec.ts`: `NotificationsGateway` mock provider added
- **Result:** 341 pass, 12 pre-existing failures unchanged

---

## Session 10 — WebSocket Gateway Crash Fix (2026-06-13)

**Commit:** `09fba87` — Fix WebSocket gateway crash — remove server.engine.on in afterInit

### Root Cause
`@WebSocketGateway({ namespace: 'notifications' })` → `afterInit()` receives a `Namespace`, not `Server`.  
`Namespace` has no `.engine` property — calling `server.engine.on(...)` threw at runtime.

### Fix
```ts
// Before (crashed)
afterInit(server: Server) {
  server.engine.on('headers', ...)
}

// After
afterInit() {
  this.logger.log(`WebSocket /notifications initialized`)
}
```

---

## Session 11 — Frontend Connectivity Fix (2026-06-13)

**Commit:** `991e5eb` — Connect storein-front to backend: session restore, token refresh, related products

### Problems Found

1. **No session restoration** — on page reload, `auth.user = null`, cart empty, wishlist empty — even with valid tokens in localStorage
2. **No token refresh** — 401 immediately redirected to `/auth/login` without trying `refresh_token`  
3. **Missing `/products/:slug/related` backend endpoint** — product detail page `getRelated()` returned 404

### Fix 1 — `http.service.js`: request interceptor + 401 refresh queue

```js
// Don't overwrite explicit Authorization (needed for refresh calls)
if (!config.headers.Authorization) {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
}

// 401 handler: queue-based refresh
if (status === 401) {
  if (originalRequest._retry || url.includes('/auth/refresh')) {
    // Hard logout — refresh itself failed
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/auth/login'
    return Promise.reject(error)
  }

  if (isRefreshing) {
    // Queue this request until refresh completes
    return new Promise((resolve, reject) => pendingQueue.push({ resolve, reject }))
      .then(token => { originalRequest.headers.Authorization = `Bearer ${token}`; return http(originalRequest) })
  }

  originalRequest._retry = true
  isRefreshing = true
  // ... refresh and retry
}
```

### Fix 2 — `auth.store.js`: `initAuth()` for session restoration

```js
async function initAuth() {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!token.value && !refreshToken) return

  if (!token.value && refreshToken) {
    const { data } = await authService.refresh()
    token.value = data.accessToken
    localStorage.setItem('access_token', data.accessToken)
    if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken)
  }

  await fetchProfile()          // http interceptor handles expired token automatically
  if (user.value) _postLoginSync()  // background: cart + wishlist
}
```

### Fix 3 — `App.vue`: call `initAuth()` on mount

```js
onMounted(() => {
  settingsStore.fetchSettings()
  authStore.initAuth()    // runs in parallel — independent
})
```

### Fix 4 — Backend: `GET /products/:slug/related`

```ts
// product.service.ts
async findRelated(slug: string, limit = 8): Promise<ProductDocument[]> {
  const product = await this.productModel.findOne({ slug, status: ACTIVE }).select('category').lean()
  if (!product) return []
  const catIds = product.category ? await this.resolveCategoryIds(...) : null
  return this.productModel
    .find({ status: ACTIVE, slug: { $ne: slug }, ...(catIds ? { category: { $in: catIds } } : {}) })
    .sort({ soldCount: -1, createdAt: -1 })
    .limit(limit).lean()
}

// product.controller.ts
@Public()
@Get(':slug/related')
findRelated(@Param('slug') slug: string) {
  return this.productService.findRelated(slug)
}
```

---

## Session 12 — Security Hardening RT-01 through RT-04 (2026-06-14)

**Commit:** `c42196c` — Security hardening & performance: RT-01 through RT-04

### RT-01 — Refresh Token: localStorage → HttpOnly Cookie

**Why:** Refresh tokens in `localStorage` are accessible via JS (XSS risk).

**Backend changes:**
- `cookie-parser` installed and wired in `main.ts`
- `JwtRefreshStrategy`: reads from `req.cookies.refreshToken` instead of `Authorization` header
- `auth.controller.ts`:
  - `verify-otp`: sets `HttpOnly; SameSite=Strict; Secure` cookie on success
  - `refresh`: rotates cookie (clears old, sets new)
  - `logout`: clears cookie (`maxAge: 0`)

```ts
// auth.controller.ts
res.cookie('refreshToken', tokens.refreshToken, {
  httpOnly: true,
  sameSite: 'strict',
  secure:   configService.get('app.nodeEnv') === 'production',
  maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 days
})
```

**Admin frontend changes:**
- `http.service.js`: `withCredentials: true` (sends cookies)
- `auth.service.js`: `refresh()` no longer passes token in body — cookie is sent automatically
- `auth.store.js`: all `localStorage.setItem/getItem('admin_refresh_token')` removed

### RT-02 — Joi: Required env vars (no localhost fallbacks)

```ts
// app.config.ts — before
allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:4000,...').split(',')

// After
allowedOrigins: process.env.ALLOWED_ORIGINS!.split(',').map(o => o.trim()).filter(Boolean)
```

```ts
// app.module.ts Joi schema
ALLOWED_ORIGINS:       Joi.string().required(),
PAYMENT_CALLBACK_URL:  Joi.string().uri().required(),
```

App fails fast at startup if env vars are missing — no silent localhost fallback in production.

### RT-03 — WebSocket CORS: function-based check (enforced before handshake)

```ts
// notifications.gateway.ts — before
cors: { origin: true }  // accept everything

// After
cors: {
  origin: (origin, callback) => {
    if (!origin || this.allowedOrigins.includes(origin)) callback(null, true)
    else callback(new Error('WS origin not allowed'))
  }
}
```

Origin check now runs at the Socket.IO level before the handshake completes, not after connection.

### RT-04 — N+1 Stock Updates → bulkWrite Batch

```ts
// product.service.ts
async bulkAdjustStock(items: { productId: string; variantId: string; delta: number }[]): Promise<void> {
  await this.productModel.bulkWrite(
    items.map(item => ({
      updateOne: {
        filter: { _id: new ObjectId(item.productId), 'variants._id': new ObjectId(item.variantId) },
        update: { $inc: { 'variants.$.stock': item.delta } },
      },
    }))
  )
  // recalc denormalized minPrice/maxPrice/totalStock for each unique product
  const uniqueIds = [...new Set(items.map(i => i.productId))]
  await Promise.all(uniqueIds.map(id => this.recalcDenormalized(id)))
}
```

Three `for-await` loops in `order.service.ts` (createFromCart, cancelMyOrder, updateStatus) replaced with single `bulkAdjustStock` call.

---

## Session 13 — Audit v3 Findings (2026-06-14)

**Commit:** `99d4e69` — Fix audit v3 findings: theme bug, dead code, tests, health endpoint

### CRITICAL — useAdminTheme: reads wrong token source

```js
// Before (broken after HttpOnly cookie refactor)
function init() {
  const token = localStorage.getItem('admin_token')  // always null now
  if (!token) return  // always returned early — theme never applied
}

// After
import { useAuthStore } from '@/stores/auth.store'
function init() {
  const token = useAuthStore().token  // reads from Pinia memory ref
  if (!token) return
  ...
}
```

### MEDIUM — Dead fallback in app.config.ts removed

```ts
// Before
allowedOrigins: process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')...
  : []   // ← dead code: Joi.required() means it's always set

// After
allowedOrigins: process.env.ALLOWED_ORIGINS!.split(',').map(o => o.trim()).filter(Boolean)
```

### MEDIUM — Admin auth.store.test.js rewritten for cookie-based auth

Updated to assert:
- Access token stored in Pinia `ref` (memory), not `localStorage`
- `admin_refresh_token` never appears in `localStorage` (HttpOnly cookie)
- `initAuth()` restores session via `/auth/refresh` (cookie sent automatically)

### LOW — Health endpoint added

```ts
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return this.health.check([
      () => this.db.pingCheck('mongodb'),
    ])
  }
}
```

- `GET /api/v1/health` → `{ status: 'ok', info: { mongodb: { status: 'up' } } }`
- Used by Cloudflare Tunnel, load balancers, uptime monitors

---

## Session 14 — Test Suite Cleanup (2026-06-14)

**Commit:** `229d1a9` — Fix all failing tests after RT-04 bulk-stock refactor

### order.service.spec.ts: adjustStock → bulkAdjustStock

RT-04 replaced `adjustStock(id, varId, delta)` with `bulkAdjustStock(items[])`.  
Spec updated to mock and assert the new signature:

```ts
// Before
productService = { adjustStock: jest.fn().mockResolvedValue({}) }
expect(productService.adjustStock).toHaveBeenCalledWith(prodId, varId, -2)

// After
productService = { bulkAdjustStock: jest.fn().mockResolvedValue(undefined) }
expect(productService.bulkAdjustStock).toHaveBeenCalledWith(
  expect.arrayContaining([expect.objectContaining({ productId: prodId, variantId: varId, delta: -2 })])
)
```

### product.store.js: `get totalPages()` → `computed()`

Plain `get` accessor in a Pinia setup store return object is **not reactive** — Pinia doesn't track it as a computed. Fixed:

```js
// Before (not reactive)
return {
  ...
  get totalPages() { return Math.ceil(total.value / limit.value) },
}

// After
const totalPages = computed(() => Math.ceil(total.value / limit.value))
return { ..., totalPages }
```

### ui.store.js: `Date.now()` → monotonic counter for toast IDs

`vi.useFakeTimers()` freezes `Date.now()` at 0 — two consecutive `addToast()` calls produced identical IDs, making `removeToast(id)` remove both instead of one.

```js
// Before
const id = Date.now()

// After
let _nextId = 1
// ...
const id = _nextId++
```

### product.store.test.js: `store.page.value` → `store.setPage()`

Pinia setup stores unwrap refs — `store.page` is a number, not a Ref. Setting `store.page.value` silently failed.

---

## Architecture Overview

```
storein/                     NestJS backend
├── src/modules/
│   ├── auth/                OTP login, JWT (access+refresh), bcrypt RT, Redis brute-force
│   ├── user/                Profile, addresses, RBAC (isAdmin, role)
│   ├── product/             CRUD, variants, stock, slug, bulk discount, related
│   ├── category/            Tree structure (ancestors array), slug, gender filter
│   ├── brand/               CRUD with public list
│   ├── color/               Color swatches with hex codes
│   ├── cart/                Session cart per user in MongoDB
│   ├── order/               Create from cart, status machine, cancel, bulk stock
│   ├── payment/             Wallet, gateway (ZarinPal), mixed, verify callback
│   ├── discount/            Coupon validate, usage tracking, date/limit guards
│   ├── review/              Verified purchase check, admin approve/reject
│   ├── search/              Full-text search, suggestions, user history
│   ├── wishlist/            Toggle, check, clear
│   ├── banner/              Active/promo filter, position
│   ├── blog/                Published/draft, tags, slug
│   ├── settings/            Site-wide config (name, theme, trust items, socials)
│   ├── notification/        SMS/email events via EventEmitter2
│   ├── upload/              File upload service
│   ├── health/              MongoDB ping via @nestjs/terminus
│   └── admin/               Admin-specific aggregates
│
storein-front/               Vue 3 customer storefront
├── src/services/            Axios wrappers + 401 refresh queue
├── src/stores/              Pinia: auth (initAuth), cart, wishlist, product, settings, ui
└── src/views/               Home, Products, ProductDetail, Cart, Checkout, Auth, User dashboard
│
storein-admin/               Vue 3 admin panel
├── src/services/            Axios with withCredentials (HttpOnly cookie)
├── src/stores/              Pinia: auth (cookie-based), ui
└── src/views/               Dashboard, Products, Categories, Brands, Colors, Orders,
                             Users, Discounts, Reviews, Banners, Blog, Settings
```

## Security Posture

| Layer | Implementation |
|-------|---------------|
| CORS | `ALLOWED_ORIGINS` env var, strict whitelist |
| HTTP headers | Helmet (X-Frame, CSP, HSTS, X-Content-Type-Options) |
| Auth | OTP-only (no passwords), JWT access (memory) + refresh (HttpOnly cookie) |
| OTP | CSPRNG (`crypto.randomInt`), rate-limit 3/10min, brute-force 5/5min |
| Refresh tokens | bcrypt-hashed in DB, rotated on every use |
| Rate limiting | ThrottlerModule: 100 req/60s global |
| WebSocket | CORS enforced at handshake, JWT verified on connect |
| XSS | DOMPurify on all `v-html` content |
| Injection | Mongoose typed queries, Joi input validation |
| Stock updates | Atomic `bulkWrite` (no race on concurrent orders) |
| Session | `initAuth()` silently restores on reload; 401 interceptor auto-refreshes |

## Environment Variables

```env
# storein/.env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/storein
REDIS_URL=redis://localhost:6379
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001   # required
PAYMENT_CALLBACK_URL=https://yourdomain.com/api/v1/payments/verify  # required
SMS_PROVIDER=console  # or kavenegar / ghasedak

# storein-front/.env
VITE_API_BASE_URL=http://localhost:3000/api/v1

# storein-admin/.env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```
