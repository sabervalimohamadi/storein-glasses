import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts            = ref([])
  const sidebarCollapsed  = ref(false)
  const sidebarMobileOpen = ref(false)

  // ── Dark mode ─────────────────────────────────────────────────
  const isDark = ref(false)

  function _applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function initTheme() {
    const stored = localStorage.getItem('theme')
    isDark.value = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    _applyTheme()
  }

  function toggleDark() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    _applyTheme()
  }

  initTheme()

  // ── Toast ─────────────────────────────────────────────────────
  function addToast(message, type = 'info', duration = 3500) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
  }
  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  // ── Sidebar ───────────────────────────────────────────────────
  function toggleSidebar()      { sidebarCollapsed.value  = !sidebarCollapsed.value }
  function openMobileSidebar()  { sidebarMobileOpen.value = true }
  function closeMobileSidebar() { sidebarMobileOpen.value = false }

  return {
    toasts, sidebarCollapsed, sidebarMobileOpen,
    addToast, removeToast,
    toggleSidebar, openMobileSidebar, closeMobileSidebar,
    isDark, toggleDark,
  }
})
