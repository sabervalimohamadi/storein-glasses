<template>
  <component :is="currentLayout">
    <RouterView />
  </component>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute }   from 'vue-router'
import { storeToRefs } from 'pinia'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout    from '@/layouts/AuthLayout.vue'
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
const ui            = useUiStore()
const { settings, theme } = storeToRefs(settingsStore)
useSiteHead(settings)

const { init, applyFromSettings } = useTheme()
watch(theme, (t) => { if (t) applyFromSettings(t) }, { immediate: true })

// ── Real-time notification handler ────────────────────────────────────────────
function onNotification(notif) {
  notifStore.addIncoming(notif)
  ui.addToast(`${notif.title}: ${notif.body}`, 'info', 5000)
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
  settingsStore.fetchSettings()
  // initAuth() is called by the router guard on every first navigation —
  // no need to call it here again (the initialized guard makes it a no-op anyway)
})
</script>
