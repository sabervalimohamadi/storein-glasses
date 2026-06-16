import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive, nextTick } from 'vue'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// Stub all child components that have their own async dependencies
vi.mock('@/components/layout/AnnouncementBar.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/components/layout/AppHeader.vue',       () => ({ default: { template: '<div/>' } }))
vi.mock('@/components/layout/AppFooter.vue',       () => ({ default: { template: '<div/>' } }))
vi.mock('@/components/layout/AppMobileNav.vue',    () => ({ default: { template: '<div/>' } }))
vi.mock('@/components/layout/AppMobileDrawer.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/components/common/BaseToast.vue',       () => ({ default: { template: '<div/>' } }))
vi.mock('@/components/common/SitePopup.vue',       () => ({ default: { template: '<div/>' } }))

// NotificationConsentModal stub — exposes modelValue as a data-attr for assertions
vi.mock('@/components/common/NotificationConsentModal.vue', () => ({
  default: {
    name: 'NotificationConsentModal',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div data-testid="consent-modal" :data-shown="String(modelValue)" />',
  },
}))

// Auth store mock — use reactive() to mimic Pinia's auto-unwrapping behaviour;
// a plain { isLoggedIn: ref(false) } would return the Ref object (truthy!) to the watcher
const authState = reactive({ isLoggedIn: false })
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => authState,
}))

// Notification permission mock
const notifState = { canAsk: ref(true) }
vi.mock('@/composables/useNotificationPermission', () => ({
  useNotificationPermission: () => notifState,
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { logger }      from '@/utils/logger'
import DefaultLayout   from './DefaultLayout.vue'

// ── Helpers ────────────────────────────────────────────────────────────────

let _wrapper = null

function makeWrapper() {
  _wrapper = mount(DefaultLayout, { slots: { default: '<div />' } })
  return _wrapper
}

function isConsentShown(w) {
  return w.find('[data-testid="consent-modal"]').attributes('data-shown') === 'true'
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DefaultLayout — notification consent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    authState.isLoggedIn    = false
    notifState.canAsk.value = true
  })

  afterEach(() => {
    // Unmount before restoring timers so onUnmounted → cancelConsent() runs in fake-timer context,
    // preventing shared-state timers from leaking into subsequent tests.
    if (_wrapper) { _wrapper.unmount(); _wrapper = null }
    vi.useRealTimers()
  })

  describe('when user is not logged in', () => {
    it('does not start a timer', async () => {
      authState.isLoggedIn = false
      makeWrapper()
      vi.advanceTimersByTime(35_000)
      await nextTick()
      // no timer should have fired — logger.debug should not have been called for scheduling
      expect(logger.debug).not.toHaveBeenCalled()
    })

    it('consent modal stays hidden', async () => {
      authState.isLoggedIn = false
      const w = makeWrapper()
      vi.advanceTimersByTime(35_000)
      await nextTick()
      expect(isConsentShown(w)).toBe(false)
    })
  })

  describe('when user logs in', () => {
    it('starts the 30-second timer and logs debug', async () => {
      authState.isLoggedIn = true
      makeWrapper()
      await nextTick()
      expect(logger.debug).toHaveBeenCalledWith(
        'scheduling notification consent in 30 s', {}, 'DefaultLayout',
      )
    })

    it('does NOT show modal before 30 s', async () => {
      authState.isLoggedIn = true
      const w = makeWrapper()
      vi.advanceTimersByTime(29_999)
      await nextTick()
      expect(isConsentShown(w)).toBe(false)
    })

    it('shows modal at exactly 30 s', async () => {
      authState.isLoggedIn = true
      const w = makeWrapper()
      vi.advanceTimersByTime(30_000)
      await nextTick()
      expect(isConsentShown(w)).toBe(true)
    })

    it('logs info when the modal is shown', async () => {
      authState.isLoggedIn = true
      makeWrapper()
      vi.advanceTimersByTime(30_000)
      await nextTick()
      expect(logger.info).toHaveBeenCalledWith(
        'showing notification consent modal to logged-in user', {}, 'DefaultLayout',
      )
    })
  })

  describe('canAsk guard', () => {
    it('does not show modal if canAsk is false at schedule time', async () => {
      authState.isLoggedIn = true
      notifState.canAsk.value    = false
      const w = makeWrapper()
      vi.advanceTimersByTime(35_000)
      await nextTick()
      expect(isConsentShown(w)).toBe(false)
    })

    it('does not show modal if canAsk becomes false before timer fires', async () => {
      authState.isLoggedIn = true
      notifState.canAsk.value    = true
      const w = makeWrapper()
      vi.advanceTimersByTime(15_000)
      // User grants/denies permission in another tab — canAsk resets
      notifState.canAsk.value = false
      vi.advanceTimersByTime(15_000)
      await nextTick()
      expect(isConsentShown(w)).toBe(false)
    })

    it('does not start timer if canAsk is already false on login', async () => {
      notifState.canAsk.value    = false
      authState.isLoggedIn = true
      makeWrapper()
      await nextTick()
      expect(logger.debug).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('cancels pending timer when user logs out', async () => {
      authState.isLoggedIn = true
      const w = makeWrapper()
      vi.advanceTimersByTime(15_000)             // halfway through
      authState.isLoggedIn = false          // logs out
      await nextTick()
      vi.advanceTimersByTime(20_000)             // would have fired
      await nextTick()
      expect(isConsentShown(w)).toBe(false)
    })

    it('hides modal immediately if open when user logs out', async () => {
      authState.isLoggedIn = true
      const w = makeWrapper()
      vi.advanceTimersByTime(30_000)             // modal appears
      await nextTick()
      expect(isConsentShown(w)).toBe(true)
      authState.isLoggedIn = false          // logs out
      await nextTick()
      expect(isConsentShown(w)).toBe(false)
    })
  })

  describe('re-login', () => {
    it('shows modal after 30 s on re-login after logout', async () => {
      authState.isLoggedIn = true
      const w = makeWrapper()
      vi.advanceTimersByTime(15_000)
      authState.isLoggedIn = false           // logout
      await nextTick()
      vi.advanceTimersByTime(20_000)
      await nextTick()
      expect(isConsentShown(w)).toBe(false)        // still hidden

      authState.isLoggedIn = true            // re-login
      await nextTick()
      vi.advanceTimersByTime(30_000)               // new 30 s
      await nextTick()
      expect(isConsentShown(w)).toBe(true)
    })

    it('does not start a second timer if already running', async () => {
      authState.isLoggedIn = true
      const w = makeWrapper()
      await nextTick()
      // simulate watch firing a second time (edge case)
      authState.isLoggedIn = false
      await nextTick()
      authState.isLoggedIn = true
      await nextTick()
      // Only one timer should be active — fire 30 s once
      vi.advanceTimersByTime(30_000)
      await nextTick()
      expect(isConsentShown(w)).toBe(true)
      // Modal should appear exactly once
      expect(logger.info).toHaveBeenCalledTimes(1)
    })
  })
})
