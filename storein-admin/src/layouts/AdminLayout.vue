<template>
  <div class="min-h-screen bg-surface flex">

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="ui.sidebarMobileOpen"
           class="fixed inset-0 bg-black/50 z-sidebar lg:hidden"
           @click="ui.closeMobileSidebar()" />
    </Transition>

    <!-- Sidebar -->
    <AdminSidebar />

    <!-- Main area -->
    <div
      class="flex-1 flex flex-col min-w-0 transition-all duration-300"
      :class="ui.sidebarCollapsed ? 'lg:pr-16' : 'lg:pr-64'"
    >
      <AdminHeader />

      <main class="flex-1 p-5 overflow-auto">
        <div class="mb-5">
          <h1 class="page-title">{{ route.meta.title }}</h1>
        </div>
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRoute }   from 'vue-router'
import { useUiStore } from '@/stores/ui.store'
import AdminSidebar   from '@/components/layout/AdminSidebar.vue'
import AdminHeader    from '@/components/layout/AdminHeader.vue'

const route = useRoute()
const ui    = useUiStore()
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
</style>
