<template>
  <component :is="currentLayout">
    <RouterView />
  </component>
  <AdminToast />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import AuthLayout  from '@/layouts/AuthLayout.vue'
import AdminToast  from '@/components/common/AdminToast.vue'

const route = useRoute()
const layouts = { admin: AdminLayout, auth: AuthLayout }
const currentLayout = computed(() => layouts[route.meta.layout] ?? AdminLayout)
</script>
