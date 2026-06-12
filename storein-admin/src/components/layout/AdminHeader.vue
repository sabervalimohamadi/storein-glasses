<template>
  <header class="sticky top-0 z-header bg-card border-b border-border flex items-center justify-between px-5 h-[60px] shadow-sm">

    <!-- Right: toggle -->
    <div class="flex items-center gap-3">
      <button @click="ui.toggleSidebar()"
        class="hidden lg:flex w-9 h-9 items-center justify-center rounded-lg
               text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <button @click="ui.openMobileSidebar()"
        class="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg
               text-text-secondary hover:bg-surface transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>

    <!-- Left: actions + user -->
    <div class="flex items-center gap-2">

      <!-- Notification bell -->
      <div class="relative" ref="bellRef">
        <button
          @click="toggleDropdown"
          class="relative w-9 h-9 flex items-center justify-center rounded-lg
                 text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
          :title="'اعلان‌ها'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span v-if="ui.unreadCount > 0"
            class="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold
                   rounded-full flex items-center justify-center leading-none">
            {{ ui.unreadCount > 9 ? '9+' : ui.unreadCount }}
          </span>
        </button>

        <!-- Dropdown -->
        <Transition name="dropdown">
          <div v-show="dropdownOpen"
            class="absolute left-0 top-full mt-2 w-80 rounded-xl shadow-lg border border-border bg-card z-[400] overflow-hidden"
            style="direction: rtl;"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-border">
              <span class="text-sm font-semibold text-text-primary">اعلان‌ها</span>
              <div class="flex items-center gap-2">
                <button v-if="ui.unreadCount > 0"
                  @click="ui.markAllRead()"
                  class="text-xs text-primary hover:underline">
                  خواندن همه
                </button>
                <button v-if="ui.notifications.length > 0"
                  @click="ui.clearNotifications()"
                  class="text-xs text-text-muted hover:text-red-500 transition-colors">
                  پاک کردن
                </button>
              </div>
            </div>

            <!-- List -->
            <div class="max-h-80 overflow-y-auto">
              <div v-if="ui.notifications.length === 0"
                class="py-8 text-center text-sm text-text-muted">
                اعلانی وجود ندارد
              </div>

              <button v-for="n in ui.notifications" :key="n.id"
                @click="onClickNotification(n)"
                class="w-full flex gap-3 px-4 py-3 text-right hover:bg-surface transition-colors border-b border-border/50 last:border-0"
                :class="{ 'bg-primary/5': !n.read }"
              >
                <!-- Icon -->
                <div class="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  :class="n.type === 'order' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'">
                  <!-- order icon -->
                  <svg v-if="n.type === 'order'" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  <!-- review icon -->
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 1.105-3.134 2-7 2s-7-.895-7-2V8c0-1.105 3.134-2 7-2s7 .895 7 2v8z"/>
                  </svg>
                </div>

                <!-- Text -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-semibold text-text-primary truncate">{{ n.title }}</span>
                    <span class="text-[10px] text-text-muted flex-shrink-0">{{ timeAgo(n.createdAt) }}</span>
                  </div>
                  <p class="text-xs text-text-secondary mt-0.5 truncate">{{ n.body }}</p>
                </div>

                <!-- Unread dot -->
                <div v-if="!n.read" class="mt-2 flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Dark mode toggle -->
      <button
        @click="ui.toggleDark()"
        :title="ui.isDark ? 'حالت روشن' : 'حالت تیره'"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
      >
        <svg v-if="ui.isDark" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </button>

      <div class="hidden sm:flex flex-col items-end">
        <span class="text-sm font-medium text-text-primary">{{ userName }}</span>
        <span class="text-xs text-primary font-medium">ادمین سیستم</span>
      </div>
      <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {{ userInitial }}
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter }     from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useUiStore }    from '@/stores/ui.store'
import { useAuthStore }  from '@/stores/auth.store'

const ui     = useUiStore()
const auth   = useAuthStore()
const router = useRouter()

const userName    = computed(() =>
  [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ') || 'مدیر سیستم'
)
const userInitial = computed(() => userName.value[0] || 'م')

// ── Notification dropdown ─────────────────────────────────────
const dropdownOpen = ref(false)
const bellRef      = ref(null)

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

onClickOutside(bellRef, () => { dropdownOpen.value = false })

function onClickNotification(n) {
  ui.markRead(n.id)
  dropdownOpen.value = false
  if (n.type === 'order'  && n.orderId)  router.push(`/orders/${n.orderId}`)
  if (n.type === 'review' && n.reviewId) router.push('/reviews')
}

// ── Relative time ─────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff <  60)  return 'همین الان'
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`
  return `${Math.floor(diff / 86400)} روز پیش`
}
</script>

<style scoped>
.dropdown-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-leave-active { transition: opacity 0.1s ease,  transform 0.1s ease; }
.dropdown-enter-from,
.dropdown-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>
