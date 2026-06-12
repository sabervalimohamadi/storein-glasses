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
  </div>
</template>

<script setup>
import AnnouncementBar from '@/components/layout/AnnouncementBar.vue'
import AppHeader       from '@/components/layout/AppHeader.vue'
import AppFooter       from '@/components/layout/AppFooter.vue'
import AppMobileNav    from '@/components/layout/AppMobileNav.vue'
import AppMobileDrawer from '@/components/layout/AppMobileDrawer.vue'
import BaseToast       from '@/components/common/BaseToast.vue'
import SitePopup      from '@/components/common/SitePopup.vue'
</script>
