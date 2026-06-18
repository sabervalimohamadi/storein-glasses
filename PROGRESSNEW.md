# Storein — Project Progress Log

> **Stack:** NestJS (backend) · Vue 3 (storein-front) · Vue 3 (storein-admin)  
> **Database:** MongoDB + Redis · **Auth:** JWT (access + refresh) + HttpOnly cookie  
> **Deployed:** Railway (3 services — backend, storefront, admin)  
> **Tests:** 408 backend (Jest) · 367 storein-front (Vitest) · 273 storein-admin (Vitest)  
> **Pre-existing failures:** 14 backend (category.service × 10, review.service × 2, + 2 new) · 17 storein-front (AppSplash × 17)

---

## Test Matrix

| Project | Framework | Files | Tests | Pass | Fail |
|---------|-----------|-------|-------|------|------|
| `storein` (backend) | Jest | 29 | 408 | 394 | 14 ¹ |
| `storein-front` | Vitest | 24 | 367 | 350 | 17 ² |
| `storein-admin` | Vitest | 12 | 273 | 273 | 0 |

> ¹ Pre-existing: `category.service.spec.ts` (10), `review.service.spec.ts` (2) + 2 new  
> ² `AppSplash.test.js` (17) — splash component was redesigned after tests written; tests need update

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
storein/                     NestJS backend (deployed: Railway Nixpacks)
├── src/modules/
│   ├── auth/                OTP login + password login, JWT, bcrypt RT, Redis brute-force
│   ├── user/                Profile, addresses, RBAC (isAdmin, role)
│   ├── product/             CRUD, variants, stock, slug, bulk discount, related, mostViewed
│   ├── category/            Tree structure (ancestors array), slug, gender filter
│   ├── brand/               CRUD with public list
│   ├── color/               Color swatches with hex codes
│   ├── cart/                Session cart per user in MongoDB
│   ├── order/               Create from cart, status machine, cancel, bulk stock
│   ├── payment/             Wallet, gateway (ZarinPal), mixed, verify callback
│   ├── discount/            Coupon validate, usage tracking, date/limit guards
│   ├── review/              Verified purchase check, admin approve/reject
│   ├── search/              Full-text, suggestions, user history, mostViewed sort
│   ├── wishlist/            Toggle, check, clear
│   ├── banner/              Active/promo filter, position
│   ├── blog/                Published/draft, tags, slug
│   ├── settings/            Site config: name, theme, socials, mobiles[], addresses[]
│   ├── notification/        Broadcast, SMS, EventEmitter2 hooks, WebSocket gateway
│   ├── upload/              File upload service
│   ├── health/              MongoDB ping via @nestjs/terminus
│   ├── page/                Static pages (slug-based)
│   ├── popup/               Popup banners
│   ├── frame-attribute/     Eyewear attribute catalogue
│   └── admin/               Admin aggregates + change-password
│
storein-front/               Vue 3 customer storefront (deployed: Railway Nixpacks + proxy)
├── src/services/            Axios wrappers + 401 refresh queue, withCredentials
├── src/stores/              Pinia: auth (initAuth), cart, wishlist, product, settings, ui, notification
├── src/components/layout/   AppHeader, AppFooter, AppSplash, AppHeaderActions (bell dropdown)
└── src/views/               Home (7 sections), Products, ProductDetail, Cart, Checkout,
                             Auth (OTP), User (dashboard, orders, notifications, wishlist)
│
storein-admin/               Vue 3 admin panel (deployed: Railway Nixpacks)
├── src/services/            Axios with withCredentials (HttpOnly cookie refresh)
├── src/stores/              Pinia: auth (cookie-based, memory token), ui
└── src/views/               Dashboard, Products, Categories, Brands, Colors, Orders,
                             Users, Discounts, Reviews, Banners, Blog, Settings,
                             Notifications (broadcast + history), ChangePassword
```

## Security Posture

| Layer | Implementation |
|-------|---------------|
| CORS | `ALLOWED_ORIGINS` env var, strict whitelist, `crossOriginResourcePolicy: 'cross-origin'` |
| HTTP headers | Helmet (X-Frame, CSP, HSTS, X-Content-Type-Options) |
| Auth | OTP login (customers) + password login (admin), JWT access (memory) + refresh (HttpOnly cookie) |
| OTP | CSPRNG (`crypto.randomInt`), rate-limit 3/10min, brute-force 5/5min |
| Admin password | bcrypt hash stored in DB, separate from OTP flow |
| Refresh tokens | bcrypt-hashed in DB, rotated on every use, SameSite=None;Secure on Railway |
| Rate limiting | ThrottlerModule: 100 req/60s global |
| WebSocket | CORS enforced at handshake via callback, JWT verified on connect |
| XSS | DOMPurify on all `v-html` content |
| Injection | Mongoose typed queries, Joi input validation |
| Stock updates | Atomic `bulkWrite` (no race on concurrent orders) |
| Session | `initAuth()` silently restores on reload; 401 interceptor auto-refreshes |
| Logout | `POST /auth/logout` clears HttpOnly cookie server-side (not just client state) |
| Cross-origin cookies | Reverse-proxy server bundled with frontends for Safari/Firefox compatibility |

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
COOKIE_SAMESITE=strict       # 'none' on Railway (cross-origin)
COOKIE_SECURE=false          # 'true' on Railway (HTTPS)
COOKIE_DOMAIN=               # set to shared parent domain if needed

# storein-front/.env
VITE_API_BASE_URL=http://localhost:3000/api/v1

# storein-admin/.env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## Session 15 — E2E Tests + Post-Audit Cleanup (2026-06-14–15)

**Commits:** `e54c8ec`, `a9dbaa5`, `90f9de7`, `790b200`

### Install Missing Packages

`cookie-parser`, `@nestjs/terminus`, `@types/cookie-parser` were imported in code but not in `package.json`.

### AppFooter quickLinks Fix

`quickLinks` in settings pointed to route `{ name: 'page', slug }` but `router` expected `{ name: 'page', params: { slug } }`. Fixed path parameter shape.

### Comprehensive E2E Tests

Added 3-layer E2E flow tests using MongoMemoryServer:

```ts
// auth.e2e.spec.ts — full OTP → token → profile → logout cycle
// cart.e2e.spec.ts — add items → place order → stock decremented
// wishlist.e2e.spec.ts — toggle, list, clear
```

Fixed 3 real bugs discovered by E2E:
- Auth: refresh endpoint was not rotating the cookie on every call (missing `res.clearCookie`)
- Cart: empty cart was returning `200 { items: [] }` instead of preserving empty state after order
- OTP brute-force counter: Redis key was namespaced differently than the guard checked

### Post-Audit 6-Task Fix

| # | Issue | Fix |
|---|-------|-----|
| 1 | MongoMemoryServer not in dev dependencies | `npm i -D mongodb-memory-server` |
| 2 | Cookie auth broke admin auth.store tests | Rewrote assertions: token in Pinia ref, not localStorage |
| 3 | Test isolation: shared Pinia state between tests | `beforeEach: setActivePinia(createPinia())` |
| 4 | CI/CD config: no `.github/workflows` | Added `ci.yml` running tests on push to master |
| 5 | `e9aa69b` Redirect loop: `App.vue` called `router.push('/')` inside `onMounted` unconditionally | Added `if (route.path !== '/')` guard |
| 6 | `a9dbaa5` Footer quickLinks wrong param shape | Fixed `{ name: 'page', slug }` → `{ name: 'page', params: { slug } }` |

---

## Session 16 — Railway Deployment (2026-06-15)

**Commits:** `3b5775b`, `40c2be4`, `6ad9b4e`, `9462abf`, `71ddf5d`, `7111fc1`, `8adb9a3`

### Railway Config (3 services)

```toml
# railway.toml (backend)
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node dist/main"
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 30
```

Three Railway services: `storein-api`, `storein-front`, `storein-admin`.

### Nixpacks Migration

- Backend: switched from Dockerfile to Nixpacks (`e913753` in same timeframe)
- Frontends: removed Docker entirely, Nixpacks uses `npx serve -s dist` as start command
- Node 20 engine pinned in `package.json` (`engines: { node: ">=20" }`) — Nixpacks respects this

### Logger Crash Fix

`AppLoggerService` used `winston.transports.File` for `combined.log` — Railway filesystem is read-only.

```ts
// Before
transports: [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'combined.log' }),  // crash
]

// After
const transports: winston.transport[] = [new winston.transports.Console()]
if (process.env.NODE_ENV !== 'production') {
  transports.push(new winston.transports.File({ filename: 'combined.log' }))
}
```

### Temp SeedModule

Added a `SeedModule` with a single `POST /seed/import` endpoint to load MongoDB dump into Railway DB over HTTP. Removed after data import.

---

## Session 17 — Admin Feature Expansion (2026-06-15–16)

**Commits:** `728a638`, `df4a237`, `c5d3f93`, `4ac167f`, `f4ea546`, `13036c9`, `20e83c4`, `f3af411`, `e18a10d`, `47f731a`, `486281f`, `4e67508`, `33b6555`, `2a0422c`, `76f76bc`, `89ee646`

### Password-Based Admin Login

Added `adminPassword` field (bcrypt) to `User` schema. Admin can now authenticate with phone + password instead of OTP.

```ts
// auth.service.ts — verifyAdminPassword
async verifyAdminPassword(phone: string, password: string): Promise<User> {
  const user = await this.userModel.findOne({ phone, isAdmin: true }).select('+adminPassword')
  if (!user?.adminPassword) throw new UnauthorizedException('رمز عبور تنظیم نشده')
  const ok = await bcrypt.compare(password, user.adminPassword)
  if (!ok) throw new UnauthorizedException('رمز عبور نادرست')
  return user
}
```

Admin login UI: dual tab (OTP / Password) → simplified to password-only → final: `c5d3f93` dual tab with autofill prevention (`autocomplete="new-password"`).

OTP length fix (`4ac167f`): backend generated 6 digits, frontend had 5 input boxes → changed to 6.

### IRANSans Fonts (Complete Set)

`f4ea546`: replaced partial IRANSansWeb with complete woff2 set from `docs/Iransans/`:
- IRANSansWeb (Regular, Bold, Light, Medium, Black, UltraLight)
- IRANSansWebFaNum (Farsi numerals variant — used for prices, dates, stats)

`13036c9`: added font files to git so Railway Nixpacks build includes them (were in `.gitignore`).

### Socket URL Fix

`20e83c4`: socket URL was hardcoded to `localhost:3000`. Fixed to derive from `VITE_API_BASE_URL`:

```js
const base = import.meta.env.VITE_API_BASE_URL  // http://api.railway.app/api/v1
const socketUrl = base.replace(/\/api\/v1$/, '')  // http://api.railway.app
```

### Initial Password Setup

`f3af411`: when admin has no `adminPassword` yet, login returns a specific error code `'NO_PASSWORD'`. Admin panel shows a "Set Password" form instead of login on first run.

### Admin Change Password

`e18a10d`: `PATCH /auth/admin/password` endpoint (admin-only). Admin panel `ChangePasswordView` with two-column layout, strength indicator (length, upper, number, special), and security tips panel.

### Send Notification / SMS Feature

`47f731a`: Admin panel can broadcast notifications:
- `POST /notifications/broadcast` — send to all users or specific group
- `POST /notifications/sms` — send raw SMS (uses configured SMS provider)
- `AdminNotificationsView`: form with type selector, message body, target audience

### Notification Panel History (`486281f`)

Admin notification panel redesigned to show:
- Sent broadcasts with timestamp, message body, target count
- Read/unread stats per broadcast
- Delete broadcast log (`76f76bc`): `DELETE /notifications/broadcast/:id` + inline confirm in UI

### ChangePasswordView Redesign (`4e67508`)

Two-column layout: form on left, security tips on right. Strength meter (0–4 bars) calculated from password complexity.

### Notification Consent Flow (`33b6555`, `2a0422c`)

After successful order: asks user for browser notification permission.

```js
// NotificationConsentBanner.vue
const grant = async () => {
  const perm = await Notification.requestPermission()
  if (perm === 'granted') subscribeUser()  // Web Push subscription
}
```

`1e92586`: moved consent trigger from `CheckoutView` to `DefaultLayout` — fires after any order, not just checkout page.

### Product Form Action Bar Redesign (`89ee646`)

Admin product form: floating action bar at bottom with save/cancel buttons. `isDirty` tracking — warns before navigation if unsaved changes. Logger calls on save/error.

---

## Session 18 — UI Fixes + Cross-Origin + Nav Redesign (2026-06-16)

**Commits:** `0fa6886`, `1f094be`, `38ca430`, `8f82efa`, `c1f777a`, `8fc78a4`, `bc60383`, `c7a0658`, `3308b21`, `46d8191`

### Desktop Nav + Mobile Drawer Redesign (`0fa6886`)

Full redesign of `AppHeader` navigation:
- Desktop: mega-menu with category columns, brand chips
- Mobile: slide-in drawer with accordion category groups
- Active state tracking, close-on-navigate

### Dropdown Overflow Fixes

`1f094be`: desktop nav mega-menu not showing — `overflow-x-auto` on parent was clipping the dropdown (it creates a new stacking context, clips `overflow: visible` children).  
Fix: removed `overflow-x-auto` from nav wrapper; used padding instead.

`38ca430`: sub-category panel in mobile drawer not showing — same issue with `overflow-hidden` clipping absolutely-positioned children.  
Fix: moved overflow clip to an inner scroll container that doesn't contain the dropdown.

### OTP Page Redesign (`8f82efa`)

Full redesign: centered card, phone number display, 6-digit input boxes, countdown timer for resend. Added logger calls and 8 Vitest tests.

### Admin Infinite Refresh Loop Fix (`c1f777a`)

**Root cause:** Admin `http.service.js` 401 handler called `/auth/refresh`. If the refresh token cookie was also expired, that returned 401 → interceptor tried to refresh again → infinite loop.

```js
// Fix: check if current request IS /auth/refresh before retrying
if (error.config?.url?.includes('/auth/refresh')) {
  authStore.clearToken()
  router.push('/login')
  return Promise.reject(error)
}
```

### SameSite=None for Cross-Origin Railway (`8fc78a4`)

Railway assigns different domains to each service (e.g., `api.railway.app` vs `front.railway.app`). Cross-origin cookies require `SameSite=None; Secure`.

```ts
res.cookie('refreshToken', token, {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  secure:   process.env.NODE_ENV === 'production',
  ...
})
```

### Session Fix on Refresh + Real-Time Notifications (`bc60383`)

Two separate bugs fixed:
1. After hard refresh, `initAuth()` sent refresh request before `withCredentials` was set on the axios instance → cookie not sent → 401 → logout. Fix: ensure `withCredentials: true` is set at instance creation, not per-request.
2. WebSocket connection was made before token was restored → socket connected as unauthenticated. Fix: `notificationStore.connect()` called *after* `initAuth()` resolves.

### Missing `onMounted` Import (`c7a0658`)

`AppHeaderActions.vue` used `onMounted` but import was removed during a refactor. Runtime error on mount. Fix: restored import.

### Header Layout Fix (`3308b21`)

RTL layout issue: actions (cart, bell, user) were rendering on the right side (visually left in RTL). Fixed with `ms-auto` (margin-start: auto) to push them to the correct RTL far-left position.

### Cross-Origin CORP Fix (`46d8191`)

Helmet's `Cross-Origin-Resource-Policy` header was set to `same-origin` by default, blocking images loaded from the API on different-origin frontends.

```ts
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
```

Also made `COOKIE_DOMAIN`, `COOKIE_SAMESITE`, `COOKIE_SECURE` explicit env vars for Railway environment parity.

---

## Session 19 — Splash Screens + Settings Integration + Sidebar Redesign (2026-06-16–17)

**Commits:** `c1ff673`, `deabb87`, `e99a8e2`, `a276820`, `596ce18`, `375eea3`, `b36917e`, `e7745e4`, `eb94e19`, `63aa656`, `805823d`, `2e8e34b`, `544e15b`, `c9b855d`, `459b1e3`, `f4d98c1`, `d477382`, `c928fb6`, `7bc35ae`, `52ab8d1`, `f261add`, `2d4c0d5`

### Storefront Splash Screen (`c1ff673`)

`AppSplash.vue`: eyewear-themed loading screen shown while settings load.
- SVG glasses animation with lens reflections
- 3 bouncing loading dots
- Fades out after `settingsStore.fetched = true`
- `c928fb6`: fixed flash — previously brand name rendered with fallback text before settings arrived; now hidden until `settingsStore.fetched`

### Reverse-Proxy for Safari/Firefox Cookie Fix (`deabb87`, `e99a8e2`)

Safari and Firefox block cross-site cookies even with `SameSite=None` in some configurations.

Solution: added a thin Express proxy server (`proxy-server.js`) bundled with the storefront that rewrites `/api/*` requests to the backend, making the browser see them as same-origin:

```js
// proxy-server.js
app.use('/api', createProxyMiddleware({
  target: process.env.BACKEND_URL,
  changeOrigin: true,
  pathFilter: '/api',  // preserve /api prefix
  on: {
    error: (err, req, res) => res.status(502).json({ message: 'proxy error' }),
  },
}))
```

`e99a8e2`: fixed `pathFilter` — without it, proxy was stripping `/api` from forwarded URL.

### Header + Footer Layout Fixes

`a276820`: logo was on left, actions on right — incorrect for RTL. Swapped flex order.  
`596ce18`: `ms-auto` to push actions to RTL far-left (visual right in LTR = visual left in RTL).  
`375eea3`: footer had empty space on desktop at 4-section width; refactored to balanced 4-column grid.

### Admin Radar-Pulse Splash (`b36917e`)

Admin panel splash: CSS radar-pulse animation with glasses SVG silhouette at center.

### Settings-Driven Dynamic Content

`e7745e4`: `AppHeader` pulls `siteName` and `tagline` from `useSettingsStore` (replaces hardcoded "استورین").  
`eb94e19`: `LoginView` pulls `siteName`, `tagline`, and `logo` from settings.  
`63aa656`: Every route sets `document.title = "${siteName} - ${pageTitle}"` via `router.afterEach`.  
`805823d`: Both splash screens show `siteName` from DB (with fallback).  
`459b1e3`: `AuthLayout` header also reads from settings store.

### Share Button (`2e8e34b`)

Product detail page: share button using Web Share API with clipboard fallback.

```js
const share = async () => {
  if (navigator.share) {
    await navigator.share({ title: product.name, url: window.location.href })
  } else {
    await navigator.clipboard.writeText(window.location.href)
    toast('لینک کپی شد')
  }
}
```

### Discount Module Fixes

`544e15b`: Discount form field `maxDiscount` renamed to `maxDiscountAmount` to match backend DTO.  
`c9b855d`: Discount list was mapping wrong fields (`code` vs `couponCode`); admin list empty even when coupons existed. Also added missing `GET /discounts` and `DELETE /discounts/:id` backend routes that were in service but not wired to controller.

### Admin Sidebar Redesign (`7bc35ae`, `f261add`, `2d4c0d5`)

Three-phase redesign:
1. `7bc35ae`: SVG icons per route, active state indicator (left border glow), clean hierarchy
2. `f261add`: deeper dark theme (`#0D1117` base), glowing active state, green pulse dot on "live" indicator
3. `2d4c0d5`: spacing polish; fixed sidebar color customization — CSS variable wasn't being applied because Tailwind JIT purged the dynamic class

`52ab8d1`: banner upload form now shows image size hints (hero: 1440×560, promo: 720×400).

---

## Session 20 — Homepage Redesign + MostViewed + Notifications Page (2026-06-17)

**Commits:** `a5a5ea6`, `eb29c43`, `f2e29cc`, `41ed7c7`, `e16c857`, `7aeff5d`, `2a8e54f`, `f01e496`, `8f33951`, `d84fb27`, `b1230c5`, `b2b6b4c`, `05c6289`

### Homepage Full Redesign (`a5a5ea6`)

`HomeView.vue` rebuilt with 7 sections:

| Section | Component | Notes |
|---------|-----------|-------|
| Hero | `HeroBanner.vue` | Full-width with CTA, linked to `/products` |
| Category chips | `CategoryStrip.vue` | Horizontal scrollable, icon per category |
| Flash sale | `FlashSaleSection.vue` | Countdown timer, discounted products |
| New arrivals | `ProductRowSection.vue` | Horizontal scroll, sort=newest |
| Promo banner | `SpecialBanner.vue` | From `/banners/promo` API |
| Most viewed | `MostViewedSection.vue` | sort=mostViewed |
| Trust strip | `TrustStrip.vue` | Icons from `settingsStore.trustItems` |

### Discount Percentage Fix (`eb29c43`)

Product cards showed wrong discount percentage. Was calculating from `minPrice` vs `comparePrice` at product level — but `comparePrice` is per-variant. Fix: pick the variant with the largest discount, calculate `Math.round((comparePrice - price) / comparePrice * 100)`.

### MostViewed Section + Sort (`f2e29cc`)

**Backend changes:**
- `search.service.ts`: added `mostViewed` to sortMap → `{ viewCount: -1, createdAt: -1 }`
- `search-query.dto.ts`: added `'mostViewed'` to sort union type
- `AppLoggerService` injected into `SearchService`, logs every `search()` call

**Frontend:**
- `constants.js`: added `{ label: 'پربازدیدترین', value: 'mostViewed' }` to `SORT_OPTIONS`
- `MostViewedSection.vue`: fetches products sorted by `mostViewed`, displays in 2-row grid

**Color iterations:**
- `41ed7c7`: light purple gradient background
- `e16c857`: changed to neon/phosphoric green (`#39FF14` family) — final color

**Tests added:**
- `constants.test.js` (4 tests): SORT_OPTIONS structure, Persian label, ordering
- `search.service.spec.ts`: +2 tests (mostViewed sort, logger call) → 13 total
- `product.service.spec.ts`: +3 tests (findAll sort: mostViewed, newest default, bestseller) → 24 total

### Product Card Dark Mode Fix (`7aeff5d`)

Dark mode: product card image background was white (from CSS `bg-white`), body text was dark-on-dark. Fixed by using CSS variables `--color-card` and `--color-text` instead of hardcoded Tailwind colors.

### Notifications Page (`2a8e54f`)

`NotificationsView.vue`: full notifications list page at `/user/notifications`.
- Groups notifications by day
- Mark-all-read button
- Per-item click → navigate to related content + mark read
- 8 Vitest tests

### Favicon + Web Manifest + Logo (`f01e496`)

- `public/favicon.svg` — SVG glasses icon
- `public/site.webmanifest` — PWA manifest with name, icons, theme color
- `public/logo.png` — brand logo served statically
- `<link rel="icon">` and `<link rel="manifest">` in `index.html` for both apps

### Admin Panel Title (`8f33951`)

`document.title` set dynamically: `useSettingsStore().siteName` injected into `router.afterEach` in admin panel.

### Admin Logout Fixes (`d84fb27`, `b1230c5`)

`d84fb27`: logout was only clearing Pinia state client-side. The HttpOnly refresh token cookie persisted — on next visit, session auto-restored. Fixed: `POST /auth/logout` called on every logout to instruct backend to clear cookie.

`b1230c5`: after logout, if user hit F5, `initAuth()` ran and restored session from still-valid cookie. Root cause: server `logout` handler wasn't actually expiring the cookie. Fixed: `res.clearCookie('refreshToken')` in `auth.controller.ts` logout handler.

### Admin Login Redesign (`b2b6b4c`)

Premium glassmorphism UI: dark blurred card, gradient border glow, phone + password fields with reveal toggle.

### Settings-Driven Login Page (`05c6289`)

Admin login page displays `siteName` from `useSettingsStore` (e.g., "استورین Admin") instead of hardcoded string.

---

## Session 21 — Footer Multi-Contact + mapsUrl (2026-06-17–18)

**Commits:** `e05b928`, `ff51790`, `ec1f13a`, `8a55351`, `205f66e`

### Footer Tagline Fix (`e05b928`)

Footer was showing `tagline` when `footerTagline` was set. Priority fixed:

```js
const displayTagline = computed(() =>
  settingsStore.settings?.footerTagline || settingsStore.settings?.tagline || ''
)
```

### Multi-Mobile + Multi-Address Support (`ff51790`, `ec1f13a`)

Settings previously had single `phone` and `address` string fields. Replaced with arrays to support multiple contact entries.

**Backend:**

```ts
// site-settings.schema.ts
mobiles:   [{ label: String, number: String }]
addresses: [{ label: String, text: String, mapsUrl: String }]
```

```ts
// update-settings.dto.ts
@IsOptional() @IsArray() @ValidateNested({ each: true })
mobiles: MobileItemDto[]

@IsOptional() @IsArray() @ValidateNested({ each: true })
addresses: AddressItemDto[]
```

### Clickable Footer Contact Items (`8a55351`)

Footer contact section renders clickable links:

```html
<!-- Phone → tel: link -->
<a :href="`tel:${m.number}`">{{ m.number }}</a>

<!-- Address → maps link (if mapsUrl provided) -->
<a :href="addr.mapsUrl" target="_blank" rel="noopener">{{ addr.text }}</a>
```

### mapsUrl Field (`205f66e`)

Added separate `mapsUrl` field to `AddressItemDto` to store Google Maps / Neshan / Balad precise coordinates URL separately from the human-readable text address.

Admin settings form: address entries now have two fields: "آدرس متنی" (text) + "لینک نقشه" (mapsUrl).

---

## Session 22 — Search Fix + Notification Bell Redesign + Mobile Fix (2026-06-18)

**Status:** Uncommitted (files modified, tests written)

### Search Suggest DTO Fix

`search-suggest.dto.ts`: added missing `q` field that was referenced in service but absent from DTO, causing TypeScript compile error on suggest endpoint.

### MostViewed Sort Option in Sort Bar

`constants.js`: added `{ label: 'پربازدیدترین', value: 'mostViewed' }` to `SORT_OPTIONS` array (displayed in category/product listing sort bar).

Tests: `constants.test.js` (4 tests — structure, Persian label, ordering, completeness).

### Notification Bell Dropdown Redesign

`AppHeaderActions.vue` — full redesign of notification dropdown:

**Per-type color icons:**

| Type | Icon | Color |
|------|------|-------|
| `order_update` / `order_shipped` | Shopping bag | Amber `#f59e0b` |
| `payment` | Credit card | Phosphoric green `#39FF14` |
| `promotion` | Tag | Purple `#a855f7` |
| default | Bell | Indigo `#818cf8` |

**Layout:**
- Icon box (36×36px, 10px border-radius) + body column
- Title row: text + unread dot inline (no separate row)
- Body text (`nd__item-sub`) + relative timestamp (`nd__item-time`)
- `nd__item--unread` class on row bg, `nd__item-title--unread` on title text

**Count limit:** `slice(0, 3)` — shows max 3 notifications (was 5).

### Notification Dropdown Positioning Fix

**Problem:** Panel was `left: 50%; transform: translateX(-50%)` relative to the ~40px bell button container → 360px panel offset 160px left of button → off-screen.

**Fix:** `left: 0; right: auto` — panel aligns to bell button's left edge, extends right.

### Mobile Viewport Fix

**Problem:** On mobile (≈390px screen), bell button sits at x≈190px; 360px panel → overflows right edge at x≈550px.

**Fix:** On `≤640px`, switch to `position: fixed` + `left: 0.5rem; right: 0.5rem; width: auto` — panel spans full viewport width.

`top` is calculated dynamically via `getBoundingClientRect()` + `nextTick`:

```js
const ndTop = ref('0px')

async function toggleNotif() {
  isNotifOpen.value = !isNotifOpen.value
  if (isNotifOpen.value) {
    await nextTick()
    const rect = notifRef.value?.getBoundingClientRect()
    if (rect) ndTop.value = `${rect.bottom + 10}px`
    if (!notifStore.fetched) await notifStore.fetchNotifications()
  }
}
```

```css
@media (max-width: 640px) {
  .nd {
    position: fixed;
    top: var(--nd-top, 64px);
    left: 0.5rem;
    right: 0.5rem;
    width: auto;
    max-width: none;
  }
}
```

**Tests:** `AppHeaderActions.test.js` — 27 tests (all pass):
- Bell visibility (logged in/out, badge count)
- Dropdown open/close, fetch on open, skip fetch if fetched
- Loading skeleton, empty state, notification list
- Max 3 rendered, unread count badge
- Unread visual indicators (classes)
- Click: markRead, no-op if read, close after click, navigate, no-nav
- See-all footer link: exists, correct route, closes dropdown
