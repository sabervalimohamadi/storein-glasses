import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/common/BaseSpinner.vue', () => ({
  default: { template: '<span />' },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute:  () => ({ query: {} }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

const authState = reactive({
  pendingPhone: '',
  loading: false,
  sendOtp: vi.fn(),
})
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => authState,
}))

vi.mock('@/stores/ui.store', () => ({
  useUiStore: () => ({ addToast: vi.fn() }),
}))

const settingsState = reactive({
  siteName: 'عینک‌فروشی نمونه',
  tagline:  'شعار آزمایشی',
  logoUrl:  '',
})
vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: () => settingsState,
}))

// ── Imports ───────────────────────────────────────────────────────────────────

import { logger }    from '@/utils/logger'
import LoginView from './LoginView.vue'

// ── Helpers ───────────────────────────────────────────────────────────────────

const factory = () => mount(LoginView, { attachTo: document.body })

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    settingsState.siteName = 'عینک‌فروشی نمونه'
    settingsState.tagline  = 'شعار آزمایشی'
    settingsState.logoUrl  = ''
    authState.pendingPhone = ''
    authState.loading      = false
  })

  // ── brand / settings ────────────────────────────────────────────────────────

  describe('site settings', () => {
    it('renders siteName from settingsStore', () => {
      const w = factory()
      expect(w.find('[data-testid="login-site-name"]').text()).toBe('عینک‌فروشی نمونه')
    })

    it('renders tagline from settingsStore', () => {
      const w = factory()
      expect(w.find('[data-testid="login-tagline"]').text()).toBe('شعار آزمایشی')
    })

    it('updates when siteName changes', async () => {
      const w = factory()
      settingsState.siteName = 'استورین'
      await w.vm.$nextTick()
      expect(w.find('[data-testid="login-site-name"]').text()).toBe('استورین')
    })

    it('updates when tagline changes', async () => {
      const w = factory()
      settingsState.tagline = 'فروشگاه تخصصی عینک'
      await w.vm.$nextTick()
      expect(w.find('[data-testid="login-tagline"]').text()).toBe('فروشگاه تخصصی عینک')
    })

    it('includes siteName in terms paragraph', () => {
      const w = factory()
      const terms = w.find('p.text-center')
      expect(terms.text()).toContain('عینک‌فروشی نمونه')
    })
  })

  // ── logo ────────────────────────────────────────────────────────────────────

  describe('logo', () => {
    it('shows fallback SVG when logoUrl is empty', () => {
      settingsState.logoUrl = ''
      const w = factory()
      expect(w.find('svg').exists()).toBe(true)
      expect(w.find('img').exists()).toBe(false)
    })

    it('shows img when logoUrl is set', () => {
      settingsState.logoUrl = 'https://example.com/logo.png'
      const w = factory()
      expect(w.find('img').exists()).toBe(true)
    })

    it('img src matches logoUrl', () => {
      settingsState.logoUrl = 'https://example.com/logo.png'
      const w = factory()
      expect(w.find('img').attributes('src')).toBe('https://example.com/logo.png')
    })

    it('img alt matches siteName', () => {
      settingsState.logoUrl = 'https://example.com/logo.png'
      const w = factory()
      expect(w.find('img').attributes('alt')).toBe('عینک‌فروشی نمونه')
    })

    it('hides SVG when logoUrl is set', () => {
      settingsState.logoUrl = 'https://example.com/logo.png'
      const w = factory()
      expect(w.find('svg').exists()).toBe(false)
    })
  })

  // ── logging ─────────────────────────────────────────────────────────────────

  describe('logging', () => {
    it('logs debug on mount with siteName', () => {
      factory()
      expect(logger.debug).toHaveBeenCalledWith(
        'login: rendering with site settings',
        { siteName: 'عینک‌فروشی نمونه', hasLogo: false },
        'LoginView',
      )
    })

    it('reports hasLogo: true when logoUrl is set', () => {
      settingsState.logoUrl = 'https://example.com/logo.png'
      factory()
      expect(logger.debug).toHaveBeenCalledWith(
        'login: rendering with site settings',
        { siteName: 'عینک‌فروشی نمونه', hasLogo: true },
        'LoginView',
      )
    })
  })
})
