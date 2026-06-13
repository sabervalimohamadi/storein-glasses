<template>
  <component :is="currentLayout">
    <RouterView />
  </component>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout    from '@/layouts/AuthLayout.vue'
import { useSettingsStore } from '@/stores/settings.store'
import { useAuthStore }     from '@/stores/auth.store'
import { useSiteHead }      from '@/composables/useHead'
import { useTheme }         from '@/composables/useTheme'

const route   = useRoute()
const layouts = { default: DefaultLayout, auth: AuthLayout }
const currentLayout = computed(() => layouts[route.meta.layout ?? 'default'])

const settingsStore = useSettingsStore()
const authStore     = useAuthStore()
const { settings, theme } = storeToRefs(settingsStore)
useSiteHead(settings)

const { init, applyFromSettings } = useTheme()

// Apply once settings are fetched
watch(theme, (t) => { if (t) applyFromSettings(t) }, { immediate: true })

onMounted(() => {
  // Run in parallel — settings and session restoration are independent
  settingsStore.fetchSettings()
  authStore.initAuth()
})
</script>
