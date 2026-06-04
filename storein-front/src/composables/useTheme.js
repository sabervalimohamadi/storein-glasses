import { ref, watch, onMounted } from 'vue'

const isDark = ref(false)

export function useTheme() {
  function applyTheme(dark) {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  function init() {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = saved ? saved === 'dark' : prefersDark
    applyTheme(isDark.value)
  }

  watch(isDark, applyTheme)

  return { isDark, toggle, init }
}
