import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts            = ref([])
  const sidebarCollapsed  = ref(false)
  const sidebarMobileOpen = ref(false)

  function addToast(message, type = 'info', duration = 3500) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
  }
  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }
  function toggleSidebar()      { sidebarCollapsed.value  = !sidebarCollapsed.value }
  function openMobileSidebar()  { sidebarMobileOpen.value = true }
  function closeMobileSidebar() { sidebarMobileOpen.value = false }

  return {
    toasts, sidebarCollapsed, sidebarMobileOpen,
    addToast, removeToast,
    toggleSidebar, openMobileSidebar, closeMobileSidebar,
  }
})
