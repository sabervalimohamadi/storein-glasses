<template>
  <div class="min-h-screen flex flex-col bg-surface">
    <header class="h-16 flex items-center justify-center border-b border-surface-border shrink-0" style="background-color: var(--color-card);">
      <RouterLink :to="{ name: 'home' }" class="flex flex-col items-center leading-tight">
        <span class="text-brand font-bold text-xl">{{ settingsStore.siteName }}</span>
        <span class="text-text-secondary text-xs">{{ settingsStore.tagline }}</span>
      </RouterLink>
    </header>

    <main class="flex-1 flex items-center justify-center px-4 py-8">
      <slot />
    </main>

    <BaseToast />
  </div>
</template>

<script setup>
import BaseToast           from '@/components/common/BaseToast.vue'
import { useSettingsStore } from '@/stores/settings.store'

const settingsStore = useSettingsStore()
</script>
