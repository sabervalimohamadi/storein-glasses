<template>
  <div
    :class="['bg-gray-200 animate-pulse', circle ? 'rounded-full' : 'rounded-lg']"
    :style="{ width, height }"
  />
</template>

<script setup>
defineProps({
  width:  { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  circle: { type: Boolean, default: false },
})
</script>
