<template>
  <span :class="['status-badge', variantClasses, sizeClass]">
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'gray' },
  size:    { type: String, default: 'md' },
})

const variantClasses = computed(() => ({
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error:   'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  gray:    'bg-gray-100 text-gray-600',
  navy:    'bg-primary/10 text-primary',
}[props.variant] ?? 'bg-gray-100 text-gray-600'))

const sizeClass = computed(() =>
  props.size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
)
</script>
