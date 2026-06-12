import { ref, watch } from 'vue'

// ── Singleton dark state (shared across all useTheme() calls) ─────
const isDark = ref(false)

// Last applied theme — needed to re-pick light/dark values on mode toggle
let _lastTheme = null

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

// ── Apply section colors based on current mode ───────────────────
function applyColors(theme, dark) {
  const root = document.documentElement.style

  function apply(cssVar, lightVal, darkVal) {
    const val = dark ? darkVal : lightVal
    if (val) root.setProperty(cssVar, val)
    else     root.removeProperty(cssVar)
  }

  apply('--color-header-bg',     theme.navbarBg,     theme.navbarBgDark)
  apply('--color-header-border', theme.navbarBorder, theme.navbarBorderDark)
  apply('--color-footer-bg',     theme.footerBg,     theme.footerBgDark)
  apply('--color-footer-text',   theme.footerText,   theme.footerTextDark)
  apply('--color-body-bg',       theme.pageBg,       theme.pageBgDark)
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
  function applyFromSettings(theme) {
    if (!theme) return
    _lastTheme = theme

    // Resolve the correct dark state FIRST (before applying colors)
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

    if (theme.primaryColor) applyPrimaryColor(theme.primaryColor)
    applyColors(theme, isDark.value)
  }

  // User manually toggles — re-applies section colors for the new mode
  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    if (_lastTheme) applyColors(_lastTheme, isDark.value)
  }

  watch(isDark, applyDarkClass)

  return { isDark, init, toggle, applyFromSettings }
}
