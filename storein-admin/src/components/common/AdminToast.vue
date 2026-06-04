<template>
  <div
    class="fixed top-4 left-1/2 -translate-x-1/2 z-toast flex flex-col items-center gap-2 pointer-events-none"
    style="min-width:300px; max-width:90vw;"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-xl shadow-dropdown',
          'pointer-events-auto text-sm font-medium w-full',
          typeClass(t.type),
        ]"
      >
        <span class="flex-shrink-0">{{ typeIcon(t.type) }}</span>
        <span class="flex-1">{{ t.message }}</span>
        <button @click="ui.removeToast(t.id)" class="opacity-60 hover:opacity-100 flex-shrink-0 text-base leading-none">
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/ui.store'
const ui = useUiStore()

const typeClass = (t) => ({
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info:    'bg-blue-600 text-white',
}[t] ?? 'bg-gray-800 text-white')

const typeIcon = (t) => ({ success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[t] ?? 'ℹ️')
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(-16px) scale(0.95); }
.toast-leave-to     { opacity: 0; transform: scale(0.9); }
</style>
