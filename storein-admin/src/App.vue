<template>
  <AdminSplash :ready="appReady" />
  <component :is="currentLayout">
    <RouterView />
  </component>
  <AdminToast />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout  from '@/layouts/AdminLayout.vue'
import AuthLayout   from '@/layouts/AuthLayout.vue'
import AdminToast   from '@/components/common/AdminToast.vue'
import AdminSplash  from '@/components/AdminSplash.vue'
import { useAuthStore } from '@/stores/auth.store'
import { logger } from '@/utils/logger'

const CTX = 'App'

const route = useRoute()
const auth  = useAuthStore()
const layouts = { admin: AdminLayout, auth: AuthLayout }
const currentLayout = computed(() => layouts[route.meta.layout] ?? AdminLayout)

// Splash gate: wait for auth init + minimum display time so radar animation completes
const appReady = ref(false)

watch(
  () => auth.initialized,
  async (initialized) => {
    if (!initialized) return
    await new Promise((r) => setTimeout(r, 1600))
    appReady.value = true
    logger.info('App: auth initialised — splash dismissed', {}, CTX)
  },
  { immediate: true },
)
</script>
