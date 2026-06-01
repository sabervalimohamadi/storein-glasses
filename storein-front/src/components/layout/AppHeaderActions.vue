<template>
  <div class="flex items-center gap-1 shrink-0">
    <!-- Notification bell (logged in only) -->
    <RouterLink
      v-if="authStore.isLoggedIn"
      :to="{ name: 'user-profile' }"
      class="relative p-2 rounded-lg text-text-secondary hover:text-brand hover:bg-surface transition-colors"
      title="اعلان‌ها"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-error text-white text-xs font-bold rounded-full flex items-center justify-center px-1 leading-none"
      >
        {{ unreadCount > 99 ? '۹۹+' : unreadCount }}
      </span>
    </RouterLink>

    <!-- Cart -->
    <RouterLink
      :to="{ name: 'cart' }"
      class="relative p-2 rounded-lg text-text-secondary hover:text-brand hover:bg-surface transition-colors"
      title="سبد خرید"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
      </svg>
      <span
        v-if="cartStore.totalItems > 0"
        class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-error text-white text-xs font-bold rounded-full flex items-center justify-center px-1 leading-none"
      >
        {{ cartStore.totalItems > 99 ? '۹۹+' : cartStore.totalItems }}
      </span>
    </RouterLink>

    <!-- User area -->
    <div ref="userRef" class="relative">
      <!-- Not logged in -->
      <RouterLink
        v-if="!authStore.isLoggedIn"
        :to="{ name: 'login' }"
        class="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand text-brand text-sm font-medium hover:bg-brand hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
        </svg>
        ورود | ثبت‌نام
      </RouterLink>
      <RouterLink
        v-if="!authStore.isLoggedIn"
        :to="{ name: 'login' }"
        class="md:hidden p-2 rounded-lg text-text-secondary hover:text-brand hover:bg-surface transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
        </svg>
      </RouterLink>

      <!-- Logged in: avatar button -->
      <button
        v-else
        class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface transition-colors"
        @click="isOpen = !isOpen"
      >
        <span class="w-8 h-8 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center shrink-0">
          {{ avatarLetter }}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
          :class="['w-3.5 h-3.5 text-text-secondary transition-transform duration-200 hidden md:block', isOpen ? 'rotate-180' : '']"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
        </svg>
      </button>

      <!-- User dropdown -->
      <Transition name="dropdown">
        <div
          v-if="isOpen && authStore.isLoggedIn"
          class="absolute top-full start-0 mt-2 w-52 bg-white rounded-xl shadow-dropdown border border-surface-border z-dropdown overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-surface-border">
            <p class="text-xs text-text-secondary">سلام،</p>
            <p class="text-sm font-semibold text-text-primary truncate">{{ userName }}</p>
          </div>
          <nav class="py-1">
            <RouterLink
              v-for="item in userMenuItems"
              :key="item.name"
              :to="{ name: item.name }"
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface transition-colors"
              @click="isOpen = false"
            >
              <component :is="item.icon" class="w-4 h-4 text-text-secondary shrink-0" />
              {{ item.label }}
            </RouterLink>
          </nav>
          <div class="border-t border-surface-border py-1">
            <button
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors"
              @click="handleLogout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
              </svg>
              خروج از حساب
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import http from '@/services/http.service'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router    = useRouter()

const userRef     = ref(null)
const isOpen      = ref(false)
const unreadCount = ref(0)

onClickOutside(userRef, () => { isOpen.value = false })

const avatarLetter = computed(() => {
  const u = authStore.user
  return (u?.firstName?.[0] || u?.name?.[0] || u?.phone?.[1] || 'ک').toUpperCase()
})

const userName = computed(() => {
  const u = authStore.user
  if (u?.firstName && u?.lastName) return `${u.firstName} ${u.lastName}`
  if (u?.firstName) return u.firstName
  return u?.phone || 'کاربر'
})

// Inline icon components (simple SVGs as render functions)
const IconUser = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' })]) }
const IconOrders = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })]) }
const IconHeart = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' })]) }

const userMenuItems = [
  { name: 'user-profile',   label: 'پروفایل من',      icon: IconUser },
  { name: 'user-orders',    label: 'سفارش‌هایم',      icon: IconOrders },
  { name: 'user-favorites', label: 'علاقه‌مندی‌ها',   icon: IconHeart },
]

async function handleLogout() {
  isOpen.value = false
  authStore.logout()
  router.push({ name: 'home' })
}

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      const { data } = await http.get('/notifications/unread-count')
      unreadCount.value = data?.count ?? 0
    } catch {}
  }
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }
</style>
