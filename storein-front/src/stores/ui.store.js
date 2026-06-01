import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts       = ref([])
  const isMenuOpen   = ref(false)
  const isSearchOpen = ref(false)

  function addToast(message, type = 'info', duration = 3000) {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
  }
  function removeToast(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }
  function toggleMenu()   { isMenuOpen.value   = !isMenuOpen.value }
  function toggleSearch() { isSearchOpen.value = !isSearchOpen.value }

  return { toasts, isMenuOpen, isSearchOpen, addToast, removeToast, toggleMenu, toggleSearch }
})
