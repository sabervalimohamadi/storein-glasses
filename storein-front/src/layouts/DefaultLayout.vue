<template>
  <div class="min-h-screen flex flex-col bg-surface">
    <AppHeader />

    <main class="flex-1 pb-14 md:pb-0">
      <slot />
    </main>

    <AppFooter class="hidden md:block" />
    <AppMobileNav />
    <AppMobileDrawer />
    <BaseToast />
  </div>
</template>

<script setup>
import AppHeader       from '@/components/layout/AppHeader.vue'
import AppFooter       from '@/components/layout/AppFooter.vue'
import AppMobileNav    from '@/components/layout/AppMobileNav.vue'
import AppMobileDrawer from '@/components/layout/AppMobileDrawer.vue'
import BaseToast       from '@/components/common/BaseToast.vue'
</script>
