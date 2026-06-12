import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Reset the singleton isDark module state between tests
vi.mock('@/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { useTheme } from './useTheme'

function makeMatchMedia(matches = false) {
  return vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('style')
  })

  afterEach(() => vi.restoreAllMocks())

  describe('init()', () => {
    it('applies dark class when localStorage is "dark"', () => {
      localStorage.setItem('theme', 'dark')
      window.matchMedia = makeMatchMedia(false)
      const { init, isDark } = useTheme()
      init()
      expect(isDark.value).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('applies light when localStorage is "light"', () => {
      localStorage.setItem('theme', 'light')
      window.matchMedia = makeMatchMedia(true)
      const { init, isDark } = useTheme()
      init()
      expect(isDark.value).toBe(false)
    })

    it('follows system preference when no localStorage entry', () => {
      window.matchMedia = makeMatchMedia(true)
      const { init, isDark } = useTheme()
      init()
      expect(isDark.value).toBe(true)
    })
  })

  describe('toggle()', () => {
    it('flips isDark and persists to localStorage', () => {
      localStorage.setItem('theme', 'light')
      window.matchMedia = makeMatchMedia(false)
      const { init, toggle, isDark } = useTheme()
      init()

      const before = isDark.value
      toggle()
      expect(isDark.value).toBe(!before)
      expect(localStorage.getItem('theme')).toBe(isDark.value ? 'dark' : 'light')
    })

    it('saves "dark" to localStorage when toggled dark', () => {
      localStorage.setItem('theme', 'light')
      window.matchMedia = makeMatchMedia(false)
      const { init, toggle } = useTheme()
      init()
      toggle()
      // After toggling from light → dark
      expect(localStorage.getItem('theme')).toBe('dark')
    })
  })

  describe('applyFromSettings()', () => {
    it('sets primaryColor CSS variable when provided', () => {
      window.matchMedia = makeMatchMedia(false)
      const { applyFromSettings } = useTheme()
      applyFromSettings({ primaryColor: '#FF5733', defaultMode: 'light' })
      const brandRgb = document.documentElement.style.getPropertyValue('--color-brand-rgb')
      expect(brandRgb).toBeTruthy()
    })

    it('ignores invalid hex colors', () => {
      window.matchMedia = makeMatchMedia(false)
      const { applyFromSettings } = useTheme()
      const before = document.documentElement.style.getPropertyValue('--color-brand-rgb')
      applyFromSettings({ primaryColor: 'not-a-color', defaultMode: 'light' })
      const after = document.documentElement.style.getPropertyValue('--color-brand-rgb')
      expect(after).toBe(before)
    })

    it('does nothing when called with null', () => {
      const { applyFromSettings } = useTheme()
      expect(() => applyFromSettings(null)).not.toThrow()
    })
  })
})
