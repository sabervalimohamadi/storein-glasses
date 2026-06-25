<template>
  <header
    class="sticky top-0 z-header shadow-sm transition-colors duration-200"
    style="background-color: var(--color-header-bg); border-bottom: 1px solid var(--color-header-border);"
  >
    <!-- Main row -->
    <div class="container-main flex items-center gap-3 h-14 md:h-16">
      <!-- Mobile hamburger -->
      <button
        class="md:hidden p-2 -ml-1 rounded-lg transition-colors"
        style="color: var(--color-text-secondary);"
        @click="uiStore.toggleMenu()"
        aria-label="منو"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
        </svg>
      </button>

      <!-- Logo — rightmost on desktop (order-3) -->
      <NuxtLink :to="'/'" class="shrink-0 leading-tight md:order-1 flex items-center gap-2" :aria-label="settingsStore.siteName">
        <!-- Combined glasses + nimrokh logo -->
        <svg width="130" height="32" viewBox="0 0 130 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- glasses frame -->
          <rect x="1.5" y="9" width="18" height="14" rx="7" stroke="rgb(var(--color-brand-rgb))" stroke-width="2.2"/>
          <rect x="23.5" y="9" width="18" height="14" rx="7" stroke="rgb(var(--color-brand-rgb))" stroke-width="2.2"/>
          <path d="M19.5 16 Q21.5 13 23.5 16" stroke="rgb(var(--color-brand-rgb))" stroke-width="2" stroke-linecap="round"/>
          <path d="M1.5 13 Q0 13 0 16" stroke="rgb(var(--color-brand-rgb))" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M41.5 13 Q43 13 43 16" stroke="rgb(var(--color-brand-rgb))" stroke-width="1.8" stroke-linecap="round"/>
          <!-- nimrokh text -->
          <text x="49" y="22" font-family="'Inter','Helvetica Neue',Arial,sans-serif" font-size="15" font-weight="700" letter-spacing="-0.3" fill="rgb(var(--color-brand-rgb))">nimrokh</text>
        </svg>
        <span class="hidden md:block text-xs" style="color: var(--color-text-secondary);">{{ settingsStore.tagline }}</span>
      </NuxtLink>

      <!-- Search (desktop) — middle (order-2) -->
      <div class="hidden md:flex md:order-2 flex-1 max-w-xl">
        <AppHeaderSearch />
      </div>

      <!-- Spacer for mobile -->
      <div class="flex-1 md:hidden" />

      <!-- Actions — leftmost on desktop (order-1) -->
      <ClientOnly>
        <AppHeaderActions class="md:order-3 md:ms-auto" />
        <template #fallback>
          <!-- SSR placeholder — same size as real actions to prevent layout shift -->
          <div class="flex items-center gap-1 shrink-0">
            <div class="w-9 h-9 rounded-lg bg-[var(--color-surface,rgba(0,0,0,.06))]" />
            <div class="w-9 h-9 rounded-lg bg-[var(--color-surface,rgba(0,0,0,.06))]" />
            <div class="w-9 h-9 rounded-lg bg-[var(--color-surface,rgba(0,0,0,.06))]" />
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Mobile search row -->
    <div class="md:hidden px-4 pb-3">
      <AppHeaderSearch />
    </div>

    <!-- Category nav (desktop) -->
    <AppHeaderNav />
  </header>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUiStore }       from '~/stores/ui.store'
import { useAuthStore }     from '~/stores/auth.store'
import { useCategoryStore } from '~/stores/category.store'
import { useCartStore }     from '~/stores/cart.store'
import { useSettingsStore } from '~/stores/settings.store'
import AppHeaderSearch  from './AppHeaderSearch.vue'
import AppHeaderActions from './AppHeaderActions.vue'
import AppHeaderNav     from './AppHeaderNav.vue'

const uiStore       = useUiStore()
const authStore     = useAuthStore()
const categoryStore = useCategoryStore()
const cartStore     = useCartStore()
const settingsStore = useSettingsStore()

onMounted(async () => {
  categoryStore.fetchCategories()
  if (authStore.isLoggedIn) {
    authStore.fetchProfile().catch(() => {})
    cartStore.fetchCart().catch(() => {})
  }
})
</script>
