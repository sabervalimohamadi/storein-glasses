<template>
  <AppSplash :ready="uiStore.appReady" />
  <component :is="currentLayout">
    <RouterView />
  </component>
  <JsonLd v-if="settingsStore.siteName" :schema="organizationSchema" />
  <JsonLd :schema="websiteSchema" />
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import { useRoute }    from 'vue-router'
import { storeToRefs } from 'pinia'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout    from '@/layouts/AuthLayout.vue'
import AppSplash                from '@/components/AppSplash.vue'
import JsonLd                   from '@/components/seo/JsonLd.vue'
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

// Fire settings fetch immediately — races ahead of auth init so the real site name
// is ready before the brand text animation starts (~1.0 s from mount).
onMounted(() => settingsStore.fetchSettings())

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

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://storein.ir'

const organizationSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type':    'Organization',
  name:       settingsStore.siteName,
  url:        BASE_URL,
  ...(settingsStore.logoUrl ? { logo: settingsStore.logoUrl.startsWith('http') ? settingsStore.logoUrl : `${BASE_URL}${settingsStore.logoUrl}` } : {}),
  ...(settingsStore.phone ? {
    contactPoint: [{
      '@type':           'ContactPoint',
      telephone:         settingsStore.phone,
      contactType:       'customer service',
      areaServed:        'IR',
      availableLanguage: 'Persian',
    }],
  } : {}),
  sameAs: [
    settingsStore.social?.instagram ? `https://instagram.com/${settingsStore.social.instagram}` : null,
    settingsStore.social?.telegram  ? `https://t.me/${settingsStore.social.telegram}`           : null,
  ].filter(Boolean),
}))

const websiteSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:       settingsStore.siteName,
  url:        BASE_URL,
  potentialAction: {
    '@type':       'SearchAction',
    target:        `${BASE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}))
</script>
