<template>
  <component :is="currentLayout">
    <RouterView />
  </component>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout    from '@/layouts/AuthLayout.vue'
import { useSettingsStore } from '@/stores/settings.store'
import { useSiteHead }      from '@/composables/useHead'

const route   = useRoute()
const layouts = { default: DefaultLayout, auth: AuthLayout }
const currentLayout = computed(() => layouts[route.meta.layout ?? 'default'])

const settingsStore     = useSettingsStore()
const { settings }      = storeToRefs(settingsStore)
useSiteHead(settings)

onMounted(() => {
  settingsStore.fetchSettings()
})
</script>
