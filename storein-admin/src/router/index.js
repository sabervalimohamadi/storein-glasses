import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { layout: 'auth', guestOnly: true },
  },
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { layout: 'admin', title: 'داشبورد' },
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/products/ProductsView.vue'),
    meta: { layout: 'admin', title: 'محصولات' },
  },
  {
    path: '/products/create',
    name: 'product-create',
    component: () => import('@/views/products/ProductFormView.vue'),
    meta: { layout: 'admin', title: 'محصول جدید' },
  },
  {
    path: '/products/:id/edit',
    name: 'product-edit',
    component: () => import('@/views/products/ProductFormView.vue'),
    meta: { layout: 'admin', title: 'ویرایش محصول' },
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/views/categories/CategoriesView.vue'),
    meta: { layout: 'admin', title: 'دسته‌بندی‌ها' },
  },
  {
    path: '/brands',
    name: 'brands',
    component: () => import('@/views/brands/BrandsView.vue'),
    meta: { layout: 'admin', title: 'برندها' },
  },
  {
    path: '/colors',
    name: 'colors',
    component: () => import('@/views/colors/ColorsView.vue'),
    meta: { layout: 'admin', title: 'رنگ‌ها' },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/orders/OrdersView.vue'),
    meta: { layout: 'admin', title: 'سفارشات' },
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    component: () => import('@/views/orders/OrderDetailView.vue'),
    meta: { layout: 'admin', title: 'جزئیات سفارش' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/users/UsersView.vue'),
    meta: { layout: 'admin', title: 'کاربران' },
  },
  {
    path: '/users/:id',
    name: 'user-detail',
    component: () => import('@/views/users/UserDetailView.vue'),
    meta: { layout: 'admin', title: 'پروفایل کاربر' },
  },
  {
    path: '/reviews',
    name: 'reviews',
    component: () => import('@/views/reviews/ReviewsView.vue'),
    meta: { layout: 'admin', title: 'نظرات' },
  },
  {
    path: '/discounts',
    name: 'discounts',
    component: () => import('@/views/discounts/DiscountsView.vue'),
    meta: { layout: 'admin', title: 'کدهای تخفیف' },
  },
  {
    path: '/banners',
    name: 'banners',
    component: () => import('@/views/banners/BannersView.vue'),
    meta: { layout: 'admin', title: 'بنرها' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { layout: 'admin', title: 'تنظیمات سایت', adminOnly: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.guestOnly && auth.isLoggedIn)
    return next({ name: 'dashboard' })

  if (to.meta.layout === 'admin' && !auth.token)
    return next({ name: 'login', query: { redirect: to.fullPath } })

  if (to.meta.layout === 'admin' && !auth.user) {
    await auth.fetchProfile()
    if (!auth.isLoggedIn) return next({ name: 'login' })
  }

  if (to.meta.adminOnly && !auth.isAdmin)
    return next({ name: 'dashboard' })

  next()
})

export default router
