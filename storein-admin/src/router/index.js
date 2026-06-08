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
    meta: { layout: 'admin', title: 'داشبورد', permission: 'dashboard' },
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/products/ProductsView.vue'),
    meta: { layout: 'admin', title: 'محصولات', permission: 'products' },
  },
  {
    path: '/products/create',
    name: 'product-create',
    component: () => import('@/views/products/ProductFormView.vue'),
    meta: { layout: 'admin', title: 'محصول جدید', permission: 'products' },
  },
  {
    path: '/products/:id/edit',
    name: 'product-edit',
    component: () => import('@/views/products/ProductFormView.vue'),
    meta: { layout: 'admin', title: 'ویرایش محصول', permission: 'products' },
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/views/categories/CategoriesView.vue'),
    meta: { layout: 'admin', title: 'دسته‌بندی‌ها', permission: 'categories' },
  },
  {
    path: '/brands',
    name: 'brands',
    component: () => import('@/views/brands/BrandsView.vue'),
    meta: { layout: 'admin', title: 'برندها', permission: 'brands' },
  },
  {
    path: '/colors',
    name: 'colors',
    component: () => import('@/views/colors/ColorsView.vue'),
    meta: { layout: 'admin', title: 'رنگ‌ها', permission: 'colors' },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/orders/OrdersView.vue'),
    meta: { layout: 'admin', title: 'سفارشات', permission: 'orders' },
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    component: () => import('@/views/orders/OrderDetailView.vue'),
    meta: { layout: 'admin', title: 'جزئیات سفارش', permission: 'orders' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/users/UsersView.vue'),
    meta: { layout: 'admin', title: 'کاربران', permission: 'users' },
  },
  {
    path: '/users/:id',
    name: 'user-detail',
    component: () => import('@/views/users/UserDetailView.vue'),
    meta: { layout: 'admin', title: 'پروفایل کاربر', permission: 'users' },
  },
  {
    path: '/reviews',
    name: 'reviews',
    component: () => import('@/views/reviews/ReviewsView.vue'),
    meta: { layout: 'admin', title: 'نظرات', permission: 'reviews' },
  },
  {
    path: '/discounts',
    name: 'discounts',
    component: () => import('@/views/discounts/DiscountsView.vue'),
    meta: { layout: 'admin', title: 'کدهای تخفیف', permission: 'discounts' },
  },
  {
    path: '/banners',
    name: 'banners',
    component: () => import('@/views/banners/BannersView.vue'),
    meta: { layout: 'admin', title: 'بنرها', permission: 'banners' },
  },
  {
    path: '/blog',
    name: 'blog',
    component: () => import('@/views/blog/BlogsView.vue'),
    meta: { layout: 'admin', title: 'بلاگ', permission: 'blog' },
  },
  {
    path: '/blog/create',
    name: 'blog-create',
    component: () => import('@/views/blog/BlogFormView.vue'),
    meta: { layout: 'admin', title: 'پست جدید', permission: 'blog' },
  },
  {
    path: '/blog/:id/edit',
    name: 'blog-edit',
    component: () => import('@/views/blog/BlogFormView.vue'),
    meta: { layout: 'admin', title: 'ویرایش پست', permission: 'blog' },
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

  // Managers can only access routes they have permission for
  if (to.meta.permission && auth.isManager && !auth.hasPermission(to.meta.permission))
    return next({ name: 'dashboard' })

  next()
})

export default router
