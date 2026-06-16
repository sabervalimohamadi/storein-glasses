<template>
  <div class="flex items-center gap-1 shrink-0">
    <!-- Dark mode toggle -->
    <button
      @click="toggleTheme"
      class="p-2 rounded-lg transition-colors"
      style="color: var(--color-text-secondary);"
      :title="isDark ? 'حالت روشن' : 'حالت تاریک'"
    >
      <!-- Moon (light mode → click for dark) -->
      <svg v-if="!isDark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
      </svg>
      <!-- Sun (dark mode → click for light) -->
      <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
      </svg>
    </button>
    <!-- Notification bell (logged in only) -->
    <div v-if="authStore.isLoggedIn" ref="notifRef" class="relative flex items-center">
      <button
        @click="toggleNotif"
        class="relative p-2 rounded-lg text-text-secondary hover:text-brand hover:bg-surface transition-colors"
        title="اعلان‌ها"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
        </svg>
        <span
          v-if="unreadCount > 0"
          class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-error text-white text-xs font-bold rounded-full flex items-center justify-center px-1 leading-none font-fanum"
        >
          {{ unreadCount > 99 ? '۹۹+' : unreadCount }}
        </span>
      </button>

      <!-- Notification dropdown -->
      <Transition name="dropdown">
        <div
          v-if="notifOpen"
          class="fixed sm:absolute top-16 sm:top-full inset-x-2 sm:inset-x-auto sm:end-0 sm:mt-2 sm:w-80 rounded-xl shadow-dropdown z-dropdown overflow-hidden"
          style="background-color:var(--color-card);border:1px solid var(--color-border);"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid var(--color-border);">
            <p class="text-sm font-bold" style="color:var(--color-text-primary);">
              اعلان‌ها
              <span v-if="unreadCount > 0" class="mr-1.5 text-xs font-bold text-white bg-error rounded-full px-1.5 py-0.5 font-fanum">{{ unreadCount }}</span>
            </p>
            <button
              v-if="unreadCount > 0"
              @click="markAllRead"
              class="text-xs font-medium hover:underline"
              style="color:var(--color-brand);"
            >
              همه را خواندم
            </button>
          </div>

          <!-- List -->
          <div class="overflow-y-auto max-h-80">
            <!-- Loading -->
            <div v-if="notifLoading" class="py-8 flex justify-center">
              <svg class="animate-spin w-5 h-5" style="color:var(--color-brand);" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>

            <!-- Empty -->
            <div v-else-if="!notifications.length" class="py-10 text-center">
              <p class="text-3xl mb-2">🔔</p>
              <p class="text-sm" style="color:var(--color-text-secondary);">اعلانی وجود ندارد</p>
            </div>

            <!-- Items -->
            <button
              v-else
              v-for="n in notifications"
              :key="n._id"
              @click="handleNotifClick(n)"
              class="w-full flex items-start gap-3 px-4 py-3 text-right transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              :style="!n.isRead ? 'background-color:var(--color-brand-subtle,rgba(59,130,246,0.06))' : ''"
            >
              <!-- Unread dot -->
              <span class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" :class="n.isRead ? 'bg-transparent' : 'bg-brand'" />
              <div class="flex-1 min-w-0 text-right">
                <p class="text-sm font-medium leading-snug" style="color:var(--color-text-primary);">{{ n.title }}</p>
                <p class="text-xs mt-0.5 line-clamp-2 leading-relaxed" style="color:var(--color-text-secondary);">{{ n.body }}</p>
                <p class="text-xs mt-1 font-fanum" style="color:var(--color-text-disabled);">{{ timeAgo(n.createdAt) }}</p>
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </div>

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
        class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-error text-white text-xs font-bold rounded-full flex items-center justify-center px-1 leading-none font-fanum"
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
          class="absolute top-full end-0 mt-2 w-56 rounded-xl shadow-dropdown z-dropdown overflow-hidden"
          style="background-color: var(--color-card); border: 1px solid var(--color-border); max-width: calc(100vw - 1rem);"
        >
          <div class="px-4 py-3" style="border-bottom: 1px solid var(--color-border);">
            <p class="text-xs" style="color: var(--color-text-secondary);">سلام،</p>
            <p class="text-sm font-semibold truncate" style="color: var(--color-text-primary);">{{ userName }}</p>
          </div>
          <nav class="py-1">
            <RouterLink
              v-for="item in userMenuItems"
              :key="item.name"
              :to="{ name: item.name }"
              class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style="color: var(--color-text-primary);"
              @mouseenter="e => e.currentTarget.style.backgroundColor = 'var(--color-bg)'"
              @mouseleave="e => e.currentTarget.style.backgroundColor = ''"
              @click="isOpen = false"
            >
              <component :is="item.icon" class="w-4 h-4 shrink-0" style="color: var(--color-text-secondary);" />
              {{ item.label }}
            </RouterLink>
          </nav>
          <div class="py-1" style="border-top: 1px solid var(--color-border);">
            <button
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error transition-colors hover:bg-red-50"
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
import { ref, computed, h } from 'vue'
import { useRouter }       from 'vue-router'
import { storeToRefs }     from 'pinia'
import { onClickOutside }  from '@vueuse/core'
import { useAuthStore }          from '@/stores/auth.store'
import { useCartStore }          from '@/stores/cart.store'
import { useNotificationStore }  from '@/stores/notification.store'
import { useTheme }              from '@/composables/useTheme'

const authStore  = useAuthStore()
const cartStore  = useCartStore()
const notifStore = useNotificationStore()
const router     = useRouter()

const userRef   = ref(null)
const notifRef  = ref(null)
const isOpen    = ref(false)
const notifOpen = ref(false)

// Notification state lives in the store so real-time pushes update the badge/list reactively
const { unreadCount, notifications, loading: notifLoading } = storeToRefs(notifStore)

const { isDark, toggle: toggleTheme, init: initTheme } = useTheme()
onMounted(() => initTheme())

onClickOutside(userRef,  () => { isOpen.value  = false })
onClickOutside(notifRef, () => { notifOpen.value = false })

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

async function toggleNotif() {
  notifOpen.value = !notifOpen.value
  // Fetch the full list the first time the dropdown is opened
  if (notifOpen.value && !notifStore.fetched) await notifStore.fetchNotifications()
}

async function handleNotifClick(n) {
  await notifStore.markRead(n._id)
  notifOpen.value = false
  const dest = resolveNotifRoute(n)
  if (dest) router.push(dest)
}

function resolveNotifRoute(n) {
  const d = n.data
  if (d?.orderId) return { name: 'user-order-detail', params: { id: d.orderId } }
  if (n.type === 'order_update') return { name: 'user-orders' }
  return null
}

async function markAllRead() {
  await notifStore.markAllRead()
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'همین الان'
  if (m < 60) return `${m} دقیقه پیش`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ساعت پیش`
  return `${Math.floor(h / 24)} روز پیش`
}

async function handleLogout() {
  isOpen.value = false
  authStore.logout()
  router.push({ name: 'home' })
}

// unreadCount is kept in sync by App.vue (fetches on login) and the real-time socket listener
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }
</style>
