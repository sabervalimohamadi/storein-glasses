<template>
  <AppSplash :ready="uiStore.appReady" />
  <component :is="currentLayout">
    <RouterView />
  </component>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute }    from 'vue-router'
import { storeToRefs } from 'pinia'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout    from '@/layouts/AuthLayout.vue'
import AppSplash                from '@/components/AppSplash.vue'
import { useSettingsStore }     from '@/stores/settings.store'
import { useAuthStore }         from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { useUiStore }           from '@/stores/ui.store'
import { socketService }        from '@/services/socket.service'
import { useSiteHead }          from '@/composables/useHead'
import { useTheme }             from '@/composables/useTheme'
import { logger }               from '@/utils/logger'

const CTX = 'App'

const route   = useRoute()
const layouts = { default: DefaultLayout, auth: AuthLayout }
const currentLayout = computed(() => layouts[route.meta.layout ?? 'default'])

const settingsStore = useSettingsStore()
const auth          = useAuthStore()
const notifStore    = useNotificationStore()
const uiStore       = useUiStore()
const { settings, theme } = storeToRefs(settingsStore)
const routeTitle = computed(() => route.meta.title ?? '')
useSiteHead(settings, routeTitle)

const { applyFromSettings } = useTheme()
watch(theme, (t) => { if (t) applyFromSettings(t) }, { immediate: true })

// ── Splash gate: wait for auth init + settings, enforce minimum display time ──
// Minimum 1.6 s ensures the full glasses draw animation completes before hiding.
watch(
  () => auth.initialized,
  async (initialized) => {
    if (!initialized) return
    await Promise.all([
      settingsStore.fetchSettings(),
      new Promise((r) => setTimeout(r, 1600)),
    ])
    uiStore.markAppReady()
    logger.info('App: initialisation complete — splash dismissed', {}, CTX)
  },
  { immediate: true },
)

// ── Real-time notification handler ────────────────────────────────────────────
function onNotification(notif) {
  notifStore.addIncoming(notif)
  uiStore.addToast(`${notif.title}: ${notif.body}`, 'info', 5000)
  logger.info('App: real-time notification shown as toast', { title: notif.title }, CTX)
}

// ── Socket lifecycle: connect when logged in, disconnect on logout ────────────
watch(
  () => auth.isLoggedIn,
  (loggedIn) => {
    if (loggedIn && auth.token) {
      socketService.connect(auth.token)
      socketService.on('notification', onNotification)
      notifStore.fetchUnreadCount()
      logger.debug('App: socket connected for user session', {}, CTX)
    } else {
      socketService.off('notification', onNotification)
      socketService.disconnect()
      notifStore.reset()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  socketService.off('notification', onNotification)
})

onMounted(() => {
  // settings are fetched in the splash watcher above (after auth.initialized)
})
</script>
