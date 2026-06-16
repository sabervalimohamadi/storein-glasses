import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/common/BaseSpinner.vue', () => ({
  default: { template: '<span />' },
}))

vi.mock('./components/OtpInput.vue', () => ({
  default: {
    name: 'OtpInput',
    props: ['modelValue', 'length', 'error', 'disabled'],
    emits: ['update:modelValue', 'complete'],
    expose: ['focus'],
    setup() { return { focus: vi.fn() } },
    template: '<div data-testid="otp-input" />',
  },
}))

const mockPush    = vi.fn()
const mockReplace = vi.fn()
const mockRoute   = reactive({ query: {} })

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useRoute:  () => mockRoute,
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

const authState = reactive({
  pendingPhone: '09123456789',
  loading:      false,
  verifyOtp:  vi.fn(),
  sendOtp:    vi.fn(),
})

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => authState,
}))

const uiMock = { addToast: vi.fn() }
vi.mock('@/stores/ui.store', () => ({
  useUiStore: () => uiMock,
}))

// ── Imports ───────────────────────────────────────────────────────────────────

import { logger } from '@/utils/logger'
import OtpView   from './OtpView.vue'

// ── Helpers ───────────────────────────────────────────────────────────────────

let _wrapper = null

function makeWrapper() {
  _wrapper = mount(OtpView, {
    global: {
      stubs: { RouterLink: { props: ['to'], template: '<a><slot /></a>' } },
    },
  })
  return _wrapper
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OtpView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    authState.pendingPhone = '09123456789'
    authState.loading      = false
    mockRoute.query        = {}
  })
  afterEach(() => {
    if (_wrapper) { _wrapper.unmount(); _wrapper = null }
    vi.useRealTimers()
  })

  // ── Guard ─────────────────────────────────────────────────────────────────

  describe('guard', () => {
    it('redirects to login when pendingPhone is missing', async () => {
      authState.pendingPhone = ''
      makeWrapper()
      await nextTick()
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })
    })

    it('logs warn when redirecting without pendingPhone', async () => {
      authState.pendingPhone = ''
      makeWrapper()
      await nextTick()
      expect(logger.warn).toHaveBeenCalledWith(
        'OTP: no pending phone, redirecting to login', {}, 'OtpView',
      )
    })

    it('does not redirect when pendingPhone is present', async () => {
      makeWrapper()
      await nextTick()
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })

  // ── maskedPhone ───────────────────────────────────────────────────────────

  describe('maskedPhone', () => {
    it('masks the last 4 digits of the phone', async () => {
      makeWrapper()
      await nextTick()
      expect(_wrapper.text()).toContain('0912 345 ****')
    })

    it('handles short phone gracefully', async () => {
      authState.pendingPhone = '091'
      makeWrapper()
      await nextTick()
      // short phone — shown as-is
      expect(_wrapper.text()).toContain('091')
    })
  })

  // ── formattedCooldown ─────────────────────────────────────────────────────

  describe('formattedCooldown', () => {
    it('shows 02:00 on mount (120 s)', async () => {
      makeWrapper()
      await nextTick()
      expect(_wrapper.text()).toContain('02:00')
    })

    it('decrements the countdown every second', async () => {
      makeWrapper()
      await nextTick()
      vi.advanceTimersByTime(3000)
      await nextTick()
      expect(_wrapper.text()).toContain('01:57')
    })

    it('hides the countdown badge once it reaches zero', async () => {
      makeWrapper()
      await nextTick()
      vi.advanceTimersByTime(120_000)
      await nextTick()
      expect(_wrapper.text()).not.toContain('00:00')
    })
  })

  // ── verify ────────────────────────────────────────────────────────────────

  describe('verify', () => {
    it('calls authStore.verifyOtp with the entered code', async () => {
      authState.verifyOtp.mockResolvedValue({})
      const w = makeWrapper()
      await nextTick()
      // Simulate OtpInput emitting complete
      await w.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '123456')
      await flushPromises()
      expect(authState.verifyOtp).toHaveBeenCalledWith('09123456789', '123456')
    })

    it('navigates to home on success with no redirect query', async () => {
      authState.verifyOtp.mockResolvedValue({})
      const w = makeWrapper()
      await nextTick()
      await w.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '123456')
      await flushPromises()
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' })
    })

    it('navigates to redirect query param on success', async () => {
      mockRoute.query = { redirect: '/checkout' }
      authState.verifyOtp.mockResolvedValue({})
      const w = makeWrapper()
      await nextTick()
      await w.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '123456')
      await flushPromises()
      expect(mockPush).toHaveBeenCalledWith('/checkout')
    })

    it('shows "کد اشتباه" error on 401', async () => {
      authState.verifyOtp.mockRejectedValue({ response: { status: 401, data: {} } })
      const w = makeWrapper()
      await nextTick()
      await w.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '000000')
      await flushPromises()
      expect(w.text()).toContain('کد تأیید اشتباه')
    })

    it('shows "منقضی شده" error on 401 with expired message', async () => {
      authState.verifyOtp.mockRejectedValue({
        response: { status: 401, data: { message: 'منقضی شده' } },
      })
      const w = makeWrapper()
      await nextTick()
      await w.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '000000')
      await flushPromises()
      expect(w.text()).toContain('منقضی شده')
    })

    it('logs info on successful verification', async () => {
      authState.verifyOtp.mockResolvedValue({})
      const w = makeWrapper()
      await nextTick()
      await w.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '123456')
      await flushPromises()
      expect(logger.info).toHaveBeenCalledWith('OTP: verification successful', {}, 'OtpView')
    })

    it('logs warn on failed verification', async () => {
      authState.verifyOtp.mockRejectedValue({ response: { status: 401, data: {} } })
      const w = makeWrapper()
      await nextTick()
      await w.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '000000')
      await flushPromises()
      expect(logger.warn).toHaveBeenCalledWith(
        'OTP: verification failed', { status: 401 }, 'OtpView',
      )
    })
  })

  // ── resend ────────────────────────────────────────────────────────────────

  describe('resend', () => {
    it('resend button is disabled while countdown is active', async () => {
      const w = makeWrapper()
      await nextTick()
      const btn = w.findAll('button').find(b => b.text().includes('ارسال مجدد'))
      expect(btn.attributes('disabled')).toBeDefined()
    })

    it('resend button is enabled after countdown expires', async () => {
      const w = makeWrapper()
      await nextTick()
      vi.advanceTimersByTime(120_000)
      await nextTick()
      const btn = w.findAll('button').find(b => b.text().includes('ارسال مجدد'))
      expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('calls authStore.sendOtp on resend click', async () => {
      authState.sendOtp.mockResolvedValue({})
      const w = makeWrapper()
      await nextTick()
      vi.advanceTimersByTime(120_000) // exhaust cooldown
      await nextTick()
      const btn = w.findAll('button').find(b => b.text().includes('ارسال مجدد'))
      await btn.trigger('click')
      await flushPromises()
      expect(authState.sendOtp).toHaveBeenCalledWith('09123456789')
    })

    it('restarts countdown after successful resend', async () => {
      authState.sendOtp.mockResolvedValue({})
      const w = makeWrapper()
      await nextTick()
      vi.advanceTimersByTime(120_000)
      await nextTick()
      const btn = w.findAll('button').find(b => b.text().includes('ارسال مجدد'))
      await btn.trigger('click')
      await flushPromises()
      await nextTick()
      expect(w.text()).toContain('02:00')
    })
  })

  // ── goBack ────────────────────────────────────────────────────────────────

  describe('goBack', () => {
    it('navigates to login when edit phone is clicked', async () => {
      const w = makeWrapper()
      await nextTick()
      const btn = w.findAll('button').find(b => b.text().includes('ویرایش'))
      await btn.trigger('click')
      expect(mockPush).toHaveBeenCalledWith({ name: 'login' })
    })
  })
})
