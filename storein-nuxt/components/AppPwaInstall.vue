<template>
  <Transition name="pwa-slide">
    <div
      v-if="visible"
      class="fixed bottom-16 md:bottom-4 inset-x-3 md:inset-x-auto md:end-4 z-[250] max-w-md md:max-w-xs mx-auto md:mx-0"
      role="complementary"
      aria-label="نصب برنامه"
    >
      <div class="bg-card border border-surface-border rounded-2xl shadow-modal p-3.5 flex items-center gap-3">

        <!-- App icon -->
        <div class="shrink-0 w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
          <img src="/favicon.svg" alt="" width="28" height="28" />
        </div>

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-text-primary leading-tight">نصب اپ استورین</p>
          <p class="text-xs text-text-secondary mt-0.5 leading-relaxed">دسترسی سریع‌تر، بدون مرورگر</p>
        </div>

        <!-- Install button + close -->
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            class="text-xs font-bold bg-brand text-white px-3 py-1.5 rounded-lg hover:bg-brand-dark active:scale-95 transition-all"
            @click="install"
          >
            نصب
          </button>
          <button
            class="p-1.5 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
            aria-label="بستن"
            @click="dismiss"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'pwa_install_dismissed'

const visible = ref(false)
let deferredPrompt = null

onMounted(() => {
  if (localStorage.getItem(STORAGE_KEY)) return
  if (window.matchMedia('(display-mode: standalone)').matches) return

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    visible.value = true
  })

  window.addEventListener('appinstalled', () => {
    visible.value = false
    localStorage.setItem(STORAGE_KEY, '1')
    deferredPrompt = null
  })
})

async function install() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  visible.value = false
  localStorage.setItem(STORAGE_KEY, '1')
}

function dismiss() {
  visible.value = false
  localStorage.setItem(STORAGE_KEY, '1')
  deferredPrompt = null
}
</script>

<style scoped>
.pwa-slide-enter-active,
.pwa-slide-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}
.pwa-slide-enter-from,
.pwa-slide-leave-to {
  transform: translateY(130%);
  opacity: 0;
}
</style>
