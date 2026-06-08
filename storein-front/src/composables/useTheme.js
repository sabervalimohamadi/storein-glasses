import { ref, watch } from 'vue'

// ── Singleton dark state (shared across all useTheme() calls) ─────
const isDark = ref(false)

// ── Color helpers ─────────────────────────────────────────────────
function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

function darken({ r, g, b }, amount = 0.18) {
  return {
    r: Math.round(r * (1 - amount)),
    g: Math.round(g * (1 - amount)),
    b: Math.round(b * (1 - amount)),
  }
}

function lighten({ r, g, b }, amount = 0.18) {
  return {
    r: Math.round(r + (255 - r) * amount),
    g: Math.round(g + (255 - g) * amount),
    b: Math.round(b + (255 - b) * amount),
  }
}

function rgbStr({ r, g, b }) {
  return `${r} ${g} ${b}`
}

// ── Apply primary color to CSS vars ──────────────────────────────
function applyPrimaryColor(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return
  const base = hexToRgb(hex)
  const root  = document.documentElement.style
  root.setProperty('--color-brand-rgb',       rgbStr(base))
  root.setProperty('--color-brand-dark-rgb',  rgbStr(darken(base)))
  root.setProperty('--color-brand-light-rgb', rgbStr(lighten(base)))
}

// ── Apply dark/light class ────────────────────────────────────────
function applyDarkClass(dark) {
  document.documentElement.classList.toggle('dark', dark)
}

export function useTheme() {

  // Called once on app boot — applies localStorage user preference
  function init() {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = saved === 'dark' || (!saved && prefersDark)
    applyDarkClass(isDark.value)
  }

  // Called after settings are fetched from API
  // Applies primaryColor, section colors, and defaultMode
  // User's own localStorage preference always wins over defaultMode
  function applyFromSettings(theme) {
    if (!theme) return

    const root = document.documentElement.style

    // Brand color
    if (theme.primaryColor) applyPrimaryColor(theme.primaryColor)

    // Section colors — only apply when a value is set (non-empty)
    if (theme.navbarBg)     root.setProperty('--color-header-bg',     theme.navbarBg)
    if (theme.navbarBorder) root.setProperty('--color-header-border', theme.navbarBorder)
    if (theme.footerBg)     root.setProperty('--color-footer-bg',     theme.footerBg)
    if (theme.footerText)   root.setProperty('--color-footer-text',   theme.footerText)

    // Dark mode — only override if user has no saved preference
    const saved = localStorage.getItem('theme')
    if (!saved && theme.defaultMode) {
      if (theme.defaultMode === 'dark') {
        isDark.value = true
      } else if (theme.defaultMode === 'light') {
        isDark.value = false
      } else if (theme.defaultMode === 'system') {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      applyDarkClass(isDark.value)
    }
  }

  // User manually toggles
  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  watch(isDark, applyDarkClass)

  return { isDark, init, toggle, applyFromSettings }
}
