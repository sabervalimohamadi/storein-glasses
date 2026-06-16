import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes = [
  // ── Public ──────────────────────────────────────────────────
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/HomeView.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/products/ProductListView.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/category/:slug',
    name: 'category',
    component: () => import('@/views/products/ProductListView.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/product/:slug',
    name: 'product-detail',
    component: () => import('@/views/product-detail/ProductDetailView.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/products/SearchView.vue'),
    meta: { layout: 'default' },
  },
  // ── Static Pages ────────────────────────────────────────────
  {
    path: '/pages/:slug',
    name: 'page',
    component: () => import('@/views/pages/PageView.vue'),
    meta: { layout: 'default' },
  },
  // ── Blog ────────────────────────────────────────────────────
  {
    path: '/blog',
    name: 'blog',
    component: () => import('@/views/blog/BlogListView.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/blog/:slug',
    name: 'blog-detail',
    component: () => import('@/views/blog/BlogDetailView.vue'),
    meta: { layout: 'default' },
  },
  // ── Auth ────────────────────────────────────────────────────
  {
    path: '/auth/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { layout: 'auth', guestOnly: true },
  },
  {
    path: '/auth/otp',
    name: 'otp',
    component: () => import('@/views/auth/OtpView.vue'),
    meta: { layout: 'auth', guestOnly: true },
  },
  // ── Cart & Checkout ─────────────────────────────────────────
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/cart/CartView.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/checkout/CheckoutView.vue'),
    meta: { layout: 'default', requiresAuth: true },
  },
  {
    path: '/payment/result',
    name: 'payment-result',
    component: () => import('@/views/payment/PaymentResultView.vue'),
    meta: { layout: 'default', requiresAuth: true },
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
      },
      {
        path: 'orders',
        name: 'user-orders',
        component: () => import('@/views/user/OrdersView.vue'),
      },
      {
        path: 'orders/:id',
        name: 'user-order-detail',
        component: () => import('@/views/user/OrderDetailView.vue'),
      },
      {
        path: 'favorites',
        name: 'user-favorites',
        component: () => import('@/views/user/FavoritesView.vue'),
      },
      {
        path: 'addresses',
        name: 'user-addresses',
        component: () => import('@/views/user/AddressesView.vue'),
      },
    ],
  },
  // ── 404 ─────────────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
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
