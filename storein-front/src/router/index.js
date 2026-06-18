import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes = [
  // ── Public ──────────────────────────────────────────────────
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/HomeView.vue'),
    meta: { layout: 'default', title: 'صفحه اصلی' },
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/products/ProductListView.vue'),
    meta: { layout: 'default', title: 'محصولات' },
  },
  {
    path: '/category/:slug',
    name: 'category',
    component: () => import('@/views/products/ProductListView.vue'),
    meta: { layout: 'default', title: 'دسته‌بندی' },
  },
  {
    path: '/product/:slug',
    name: 'product-detail',
    component: () => import('@/views/product-detail/ProductDetailView.vue'),
    meta: { layout: 'default', title: 'محصول' },
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/products/SearchView.vue'),
    meta: { layout: 'default', title: 'جستجو' },
  },
  // ── Static Pages ────────────────────────────────────────────
  {
    path: '/pages/:slug',
    name: 'page',
    component: () => import('@/views/pages/PageView.vue'),
    meta: { layout: 'default', title: '' },
  },
  // ── Blog ────────────────────────────────────────────────────
  {
    path: '/blog',
    name: 'blog',
    component: () => import('@/views/blog/BlogListView.vue'),
    meta: { layout: 'default', title: 'وبلاگ' },
  },
  {
    path: '/blog/:slug',
    name: 'blog-detail',
    component: () => import('@/views/blog/BlogDetailView.vue'),
    meta: { layout: 'default', title: 'مقاله' },
  },
  // ── Auth ────────────────────────────────────────────────────
  {
    path: '/auth/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { layout: 'auth', guestOnly: true, title: 'ورود' },
  },
  {
    path: '/auth/otp',
    name: 'otp',
    component: () => import('@/views/auth/OtpView.vue'),
    meta: { layout: 'auth', guestOnly: true, title: 'تأیید شماره موبایل' },
  },
  // ── Cart & Checkout ─────────────────────────────────────────
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/cart/CartView.vue'),
    meta: { layout: 'default', title: 'سبد خرید' },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/checkout/CheckoutView.vue'),
    meta: { layout: 'default', requiresAuth: true, title: 'تکمیل خرید' },
  },
  {
    path: '/payment/result',
    name: 'payment-result',
    component: () => import('@/views/payment/PaymentResultView.vue'),
    meta: { layout: 'default', requiresAuth: true, title: 'نتیجه پرداخت' },
  },
  // ── User Dashboard ──────────────────────────────────────────
  {
    path: '/user',
    meta: { layout: 'default', requiresAuth: true },
    children: [
      {
        path: 'profile',
        name: 'user-profile',
        component: () => import('@/views/user/ProfileView.vue'),
        meta: { title: 'پروفایل' },
      },
      {
        path: 'orders',
        name: 'user-orders',
        component: () => import('@/views/user/OrdersView.vue'),
        meta: { title: 'سفارش‌ها' },
      },
      {
        path: 'orders/:id',
        name: 'user-order-detail',
        component: () => import('@/views/user/OrderDetailView.vue'),
        meta: { title: 'جزئیات سفارش' },
      },
      {
        path: 'favorites',
        name: 'user-favorites',
        component: () => import('@/views/user/FavoritesView.vue'),
        meta: { title: 'علاقه‌مندی‌ها' },
      },
      {
        path: 'addresses',
        name: 'user-addresses',
        component: () => import('@/views/user/AddressesView.vue'),
        meta: { title: 'آدرس‌ها' },
      },
      {
        path: 'notifications',
        name: 'user-notifications',
        component: () => import('@/views/user/NotificationsView.vue'),
        meta: { title: 'اعلان‌ها' },
      },
    ],
  },
  // ── 404 ─────────────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'صفحه یافت نشد' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    return saved ?? { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  // Restore session from HttpOnly refresh-token cookie on first navigation (page refresh).
  // Must happen BEFORE checking isLoggedIn, otherwise the guard fires before the token
  // is restored and bounces every logged-in user to the login page on reload.
  if (!auth.initialized) {
    await auth.initAuth()
  }
  if (to.meta.requiresAuth && !auth.isLoggedIn)
    return next({ name: 'login', query: { redirect: to.fullPath } })
  if (to.meta.guestOnly && auth.isLoggedIn)
    return next({ name: 'home' })
  next()
})

export default router
