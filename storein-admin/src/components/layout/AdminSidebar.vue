<template>
  <!-- Desktop sidebar -->
  <aside :class="[
    'fixed top-0 right-0 h-full bg-sidebar-bg z-sidebar flex flex-col',
    'transition-all duration-300 shadow-sidebar hidden lg:flex',
    ui.sidebarCollapsed ? 'w-16' : 'w-64',
  ]">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border min-h-[60px]">
      <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/>
          <path stroke-linecap="round" d="M11 12h2"/>
        </svg>
      </div>
      <Transition name="fade-text">
        <div v-if="!ui.sidebarCollapsed">
          <p class="text-white font-bold text-sm leading-none">استورین</p>
          <p class="text-sidebar-text text-xs mt-0.5">پنل مدیریت</p>
        </div>
      </Transition>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide">
      <div v-for="group in navGroups" :key="group.label" class="mb-4">
        <p v-if="!ui.sidebarCollapsed && group.label"
           class="text-sidebar-text text-xs font-medium px-3 mb-1 uppercase tracking-wider">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items"
          :key="item.name"
          :to="{ name: item.name }"
          :title="ui.sidebarCollapsed ? item.label : ''"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 group relative',
            isActive(item)
              ? 'bg-primary text-white'
              : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
          ]"
        >
          <span class="text-base flex-shrink-0 w-5 text-center leading-none">{{ item.icon }}</span>
          <Transition name="fade-text">
            <span v-if="!ui.sidebarCollapsed" class="text-sm font-medium">{{ item.label }}</span>
          </Transition>
          <!-- Collapsed tooltip -->
          <div v-if="ui.sidebarCollapsed"
               class="absolute right-full mr-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md
                      whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100
                      transition-opacity duration-150 z-dropdown">
            {{ item.label }}
          </div>
        </RouterLink>
      </div>
    </nav>

    <!-- Footer -->
    <div class="border-t border-sidebar-border px-2 py-3 space-y-1">
      <!-- Role badge -->
      <div v-if="!ui.sidebarCollapsed && auth.user"
           class="flex items-center gap-2 px-3 py-1.5">
        <span class="text-xs text-sidebar-text">{{ auth.user.phone }}</span>
        <span :class="[
          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          auth.isAdmin ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-400',
        ]">
          {{ auth.isAdmin ? 'ادمین' : 'مدیر' }}
        </span>
      </div>
      <a href="http://localhost:3000" target="_blank"
         :class="[
           'flex items-center gap-3 px-3 py-2.5 rounded-lg',
           'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
           'transition-all duration-150 text-sm',
         ]">
        <span class="text-base flex-shrink-0 w-5 text-center">🌐</span>
        <span v-if="!ui.sidebarCollapsed">مشاهده سایت</span>
      </a>
      <button @click="logout"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full',
          'text-sidebar-text hover:bg-red-900/30 hover:text-red-400',
          'transition-all duration-150 text-sm',
        ]">
        <span class="text-base flex-shrink-0 w-5 text-center">🚪</span>
        <span v-if="!ui.sidebarCollapsed">خروج</span>
      </button>
    </div>
  </aside>

  <!-- Mobile drawer -->
  <aside :class="[
    'fixed top-0 right-0 h-full bg-sidebar-bg z-sidebar w-64 flex flex-col',
    'transition-transform duration-300 shadow-sidebar lg:hidden',
    ui.sidebarMobileOpen ? 'translate-x-0' : 'translate-x-full',
  ]">
    <div class="flex items-center justify-between gap-3 px-4 py-4 border-b border-sidebar-border min-h-[60px]">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span class="text-white text-sm font-bold">S</span>
        </div>
        <div>
          <p class="text-white font-bold text-sm">استورین</p>
          <p class="text-sidebar-text text-xs">پنل مدیریت</p>
        </div>
      </div>
      <button @click="ui.closeMobileSidebar()" class="text-sidebar-text hover:text-white p-1">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide">
      <div v-for="group in navGroups" :key="group.label" class="mb-4">
        <p v-if="group.label"
           class="text-sidebar-text text-xs font-medium px-3 mb-1 uppercase tracking-wider">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items" :key="item.name"
          :to="{ name: item.name }"
          @click="ui.closeMobileSidebar()"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm',
            isActive(item)
              ? 'bg-primary text-white'
              : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
          ]"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore }   from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()
const auth   = useAuthStore()

const navGroups = computed(() => [
  {
    label: '',
    items: [{ name: 'dashboard', icon: '📊', label: 'داشبورد' }],
  },
  {
    label: 'فروشگاه',
    items: [
      { name: 'products',   icon: '📦', label: 'محصولات' },
      { name: 'categories', icon: '🏷️', label: 'دسته‌بندی‌ها' },
      { name: 'brands',     icon: '🔖', label: 'برندها' },
      { name: 'colors',     icon: '🎨', label: 'رنگ‌ها' },
      { name: 'banners',    icon: '🖼', label: 'بنرها' },
      { name: 'orders',     icon: '🛒', label: 'سفارشات' },
      { name: 'discounts',  icon: '🎟️', label: 'کدهای تخفیف' },
    ],
  },
  {
    label: 'مدیریت',
    items: [
      { name: 'users',    icon: '👥', label: 'کاربران' },
      { name: 'reviews',  icon: '⭐', label: 'نظرات' },
      ...(auth.isAdmin ? [{ name: 'settings', icon: '⚙️', label: 'تنظیمات سایت' }] : []),
    ],
  },
])

function isActive(item) {
  return route.name === item.name ||
    route.path.startsWith('/' + item.name.split('-')[0])
}

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.fade-text-enter-active,
.fade-text-leave-active { transition: opacity 0.15s ease; }
.fade-text-enter-from,
.fade-text-leave-to { opacity: 0; }
</style>
