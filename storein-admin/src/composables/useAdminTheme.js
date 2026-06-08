import { ref } from 'vue'
import http from '@/services/http.service'

// Module-level singleton — survives hot-reloads but fetched once
const sidebarBg = ref('')
let fetched = false

function apply(theme) {
  if (!theme) return
  sidebarBg.value = theme.sidebarBg ?? ''
}

async function init() {
  if (fetched) return
  fetched = true
  try {
    const { data } = await http.get('/settings')
    apply(data?.theme)
  } catch { /* non-critical — default sidebar color used */ }
}

// Called immediately after admin saves settings so sidebar updates without reload
function applyTheme(theme) {
  apply(theme)
}

export function useAdminTheme() {
  return { sidebarBg, init, applyTheme }
}
