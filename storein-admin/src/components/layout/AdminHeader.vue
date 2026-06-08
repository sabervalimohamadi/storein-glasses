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
      <!-- Dark mode toggle -->
      <button
        @click="ui.toggleDark()"
        :title="ui.isDark ? 'حالت روشن' : 'حالت تیره'"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
      >
        <!-- Sun — shown in dark mode -->
        <svg v-if="ui.isDark" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <!-- Moon — shown in light mode -->
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
import { computed } from 'vue'
import { useUiStore }   from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'

const ui   = useUiStore()
const auth = useAuthStore()

const userName    = computed(() =>
  [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ') || 'مدیر سیستم'
)
const userInitial = computed(() => userName.value[0] || 'م')
</script>
