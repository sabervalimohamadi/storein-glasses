import { ref } from 'vue'
import http from '@/services/http.service'

const sidebarBg     = ref('')
const sidebarBgDark = ref('')
let fetched = false

function apply(theme) {
  if (!theme) return
  sidebarBg.value     = theme.sidebarBg     ?? ''
  sidebarBgDark.value = theme.sidebarBgDark ?? ''
}

async function init() {
  if (fetched) return
  if (!localStorage.getItem('admin_token')) return
  fetched = true
  try {
    const { data } = await http.get('/settings', { skipErrorLog: true })
    apply(data?.theme)
  } catch { /* non-critical — default sidebar color used */ }
}

function applyTheme(theme) {
  apply(theme)
}

export function useAdminTheme() {
  return { sidebarBg, sidebarBgDark, init, applyTheme }
}
