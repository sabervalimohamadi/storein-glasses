<template>
  <header class="sticky top-0 z-header bg-white border-b border-surface-border shadow-sm">
    <!-- Main row -->
    <div class="container-main flex items-center gap-3 h-14 md:h-16">
      <!-- Mobile hamburger -->
      <button
        class="md:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:text-brand hover:bg-surface transition-colors"
        @click="uiStore.toggleMenu()"
        aria-label="منو"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
        </svg>
      </button>

      <!-- Logo -->
      <RouterLink :to="{ name: 'home' }" class="flex flex-col items-start shrink-0 leading-tight">
        <span class="text-brand font-bold text-xl tracking-tight">استورین</span>
        <span class="text-text-secondary text-xs hidden md:block -mt-0.5">فروشگاه تخصصی عینک</span>
      </RouterLink>

      <!-- Search (desktop) -->
      <div class="hidden md:flex flex-1 max-w-xl">
        <AppHeaderSearch />
      </div>

      <!-- Spacer for mobile -->
      <div class="flex-1 md:hidden" />

      <!-- Actions (cart, user, bell) -->
      <AppHeaderActions />
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
import { useUiStore }      from '@/stores/ui.store'
import { useAuthStore }    from '@/stores/auth.store'
import { useCategoryStore } from '@/stores/category.store'
import { useCartStore }    from '@/stores/cart.store'
import AppHeaderSearch  from './AppHeaderSearch.vue'
import AppHeaderActions from './AppHeaderActions.vue'
import AppHeaderNav     from './AppHeaderNav.vue'

const uiStore       = useUiStore()
const authStore     = useAuthStore()
const categoryStore = useCategoryStore()
const cartStore     = useCartStore()

onMounted(async () => {
  categoryStore.fetchCategories()
  if (authStore.isLoggedIn) {
    authStore.fetchProfile().catch(() => {})
    cartStore.fetchCart().catch(() => {})
  }
})
</script>
