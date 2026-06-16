<template>
  <div class="min-h-screen flex flex-col bg-surface">
    <AnnouncementBar />
    <AppHeader />

    <main class="flex-1 pb-14 md:pb-0">
      <slot />
    </main>

    <AppFooter class="pb-14 md:pb-0" />
    <AppMobileNav />
    <AppMobileDrawer />
    <BaseToast />
    <SitePopup />
    <!-- Notification consent: shown 30 s after login, never during a transaction -->
    <NotificationConsentModal v-model="showConsentModal" />
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import AnnouncementBar          from '@/components/layout/AnnouncementBar.vue'
import AppHeader                from '@/components/layout/AppHeader.vue'
import AppFooter                from '@/components/layout/AppFooter.vue'
import AppMobileNav             from '@/components/layout/AppMobileNav.vue'
import AppMobileDrawer          from '@/components/layout/AppMobileDrawer.vue'
import BaseToast                from '@/components/common/BaseToast.vue'
import SitePopup                from '@/components/common/SitePopup.vue'
import NotificationConsentModal from '@/components/common/NotificationConsentModal.vue'
import { useAuthStore }              from '@/stores/auth.store'
import { useNotificationPermission } from '@/composables/useNotificationPermission'
import { logger }                    from '@/utils/logger'

const CTX = 'DefaultLayout'
const CONSENT_DELAY_MS = 30_000

const auth       = useAuthStore()
const { canAsk } = useNotificationPermission()

const showConsentModal = ref(false)
let   consentTimer     = null

function scheduleConsent() {
  if (consentTimer || !canAsk.value) return
  logger.debug('scheduling notification consent in 30 s', {}, CTX)
  consentTimer = setTimeout(() => {
    consentTimer = null
    if (!canAsk.value) return
    logger.info('showing notification consent modal to logged-in user', {}, CTX)
    showConsentModal.value = true
  }, CONSENT_DELAY_MS)
}

function cancelConsent() {
  if (consentTimer) { clearTimeout(consentTimer); consentTimer = null }
  showConsentModal.value = false
}

watch(
  () => auth.isLoggedIn,
  (loggedIn) => { if (loggedIn) scheduleConsent(); else cancelConsent() },
  { immediate: true },
)

onUnmounted(cancelConsent)
</script>
