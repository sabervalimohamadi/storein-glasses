<template>
  <div class="fixed top-4 inset-x-0 flex flex-col items-center z-toast pointer-events-none px-4">
    <TransitionGroup name="toast" tag="div" class="flex flex-col items-center gap-2 w-full max-w-sm">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['flex items-center gap-3 px-4 py-3 rounded-xl shadow-dropdown pointer-events-auto w-full', typeClass(toast.type)]"
      >
        <span class="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-white text-xs font-bold" :class="iconBg(toast.type)">
          {{ typeIcon(toast.type) }}
        </span>
        <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
        <button class="shrink-0 opacity-50 hover:opacity-100 transition-opacity" @click="uiStore.removeToast(toast.id)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUiStore } from '~/stores/ui.store'

const uiStore = useUiStore()
const { toasts } = storeToRefs(uiStore)

function typeClass(type) {
  return {
    success: 'bg-green-50 text-green-800 border border-green-200',
    error:   'bg-red-50 text-red-800 border border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    info:    'bg-blue-50 text-blue-800 border border-blue-200',
  }[type] || 'bg-surface-card text-text-primary border border-surface-border'
}

function iconBg(type) {
  return {
    success: 'bg-green-500',
    error:   'bg-red-500',
    warning: 'bg-yellow-500',
    info:    'bg-blue-500',
  }[type] || 'bg-gray-400'
}

function typeIcon(type) {
  return { success: '✓', error: '✕', warning: '!', info: 'i' }[type] || 'i'
}
</script>

<style scoped>
.toast-move,
.toast-enter-active,
.toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-16px) scale(0.95); }
.toast-leave-to   { opacity: 0; transform: translateY(-8px) scale(0.95); }
.toast-leave-active { position: absolute; }
</style>
