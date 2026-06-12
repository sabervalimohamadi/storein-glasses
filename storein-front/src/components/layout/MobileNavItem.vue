<template>
  <div>
    <!-- Row -->
    <div
      class="flex items-center transition-colors"
      :style="`color: var(--color-text-primary); background-color: ${open ? 'var(--color-bg)' : ''}`"
    >
      <!-- Indent spacer -->
      <span v-if="depth > 0" :style="`width: ${depth * 16}px; flex-shrink: 0;`" />

      <!-- Name -->
      <RouterLink
        :to="{ name: 'category', params: { slug: item.slug } }"
        @click="$emit('close')"
        class="flex-1 py-2.5 text-sm"
        :class="depth === 0 ? 'px-4 font-medium' : 'px-3'"
        :style="depth > 0 ? 'color: var(--color-text-secondary);' : ''"
      >
        <span v-if="depth > 0" class="ml-1" style="color: var(--color-text-disabled);">└</span>
        {{ item.name }}
      </RouterLink>

      <!-- Expand toggle -->
      <button
        v-if="item.children?.length"
        @click.stop="open = !open"
        class="px-4 py-2.5 flex-shrink-0 transition-transform duration-200"
        :style="open ? 'transform: rotate(-90deg); color: var(--color-brand);' : 'color: var(--color-text-disabled);'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
        </svg>
      </button>
    </div>

    <!-- Children (recursive) -->
    <div v-if="open && item.children?.length" style="background-color: var(--color-bg);">
      <MobileNavItem
        v-for="child in item.children"
        :key="child._id"
        :item="child"
        :depth="depth + 1"
        @close="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  item:  { type: Object, required: true },
  depth: { type: Number, default: 0 },
})
defineEmits(['close'])

const open = ref(false)
</script>
