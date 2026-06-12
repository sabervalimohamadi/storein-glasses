<template>
  <section class="py-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <div
        v-for="(item, idx) in trustItems"
        :key="idx"
        class="rounded-xl p-4 flex items-start gap-3 shadow-card hover:shadow-md transition-shadow duration-200"
        style="background-color: var(--color-card);"
      >
        <div
          class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-2xl"
          :style="{ backgroundColor: item.bgColor }"
        >
          {{ item.icon }}
        </div>
        <div class="min-w-0">
          <h4 class="font-bold text-text-primary text-sm mb-0.5 leading-snug">{{ item.title }}</h4>
          <p class="text-text-secondary text-xs leading-relaxed">{{ item.subtitle }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings.store'
const { trustItems } = useSettingsStore()
</script>
