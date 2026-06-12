import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/auth.service', () => ({
  authService: {
    sendOtp:    vi.fn(),
    verifyOtp:  vi.fn(),
    getProfile: vi.fn(),
    logout:     vi.fn(),
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('@/stores/cart.store', () => ({
  useCartStore: vi.fn(() => ({ fetchCart: vi.fn(), items: [] })),
}))

vi.mock('@/stores/wishlist.store', () => ({
  useWishlistStore: vi.fn(() => ({ fetchWishlist: vi.fn(), wishlistIds: new Set() })),
}))

import { useAuthStore } from './auth.store'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('sendOtp', () => {
    it('sets pendingPhone on success', async () => {
      authService.sendOtp.mockResolvedValue({})
      const store = useAuthStore()
      await store.sendOtp('09121234567')
      expect(store.pendingPhone).toBe('09121234567')
      expect(store.loading).toBe(false)
    })

    it('logs error and re-throws on failure', async () => {
      const err = new Error('network error')
      authService.sendOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await expect(store.sendOtp('09121234567')).rejects.toThrow('network error')
      expect(logger.error).toHaveBeenCalledWith(
        'auth: sendOtp failed', err, {}, 'AuthStore',
      )
      expect(store.loading).toBe(false)
    })
  })

  describe('verifyOtp', () => {
    it('sets token and isLoggedIn on success', async () => {
      authService.verifyOtp.mockResolvedValue({
        data: { accessToken: 'at-123', refreshToken: 'rt-456', isNewUser: false },
      })
      authService.getProfile.mockResolvedValue({ data: { _id: 'u1', phone: '09121234567' } })

      const store = useAuthStore()
      const result = await store.verifyOtp('09121234567', '123456')

      expect(store.token).toBe('at-123')
      expect(store.isLoggedIn).toBe(true)
      expect(localStorage.getItem('access_token')).toBe('at-123')
      expect(localStorage.getItem('refresh_token')).toBe('rt-456')
      expect(result.accessToken).toBe('at-123')
    })

    it('logs error and re-throws on failure', async () => {
      const err = new Error('invalid code')
      authService.verifyOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await expect(store.verifyOtp('09121234567', 'wrong')).rejects.toThrow('invalid code')
      expect(logger.error).toHaveBeenCalledWith(
        'auth: verifyOtp failed', err, {}, 'AuthStore',
      )
    })
  })

  describe('logout', () => {
    it('clears token, user, and localStorage', async () => {
      authService.logout.mockResolvedValue({})
      localStorage.setItem('access_token', 'at-old')
      localStorage.setItem('refresh_token', 'rt-old')

      const store = useAuthStore()
      store.token = 'at-old'
      store.user  = { _id: 'u1' }

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })
  })

  describe('isLoggedIn', () => {
    it('is false when no token', () => {
      const store = useAuthStore()
      store.token = null
      expect(store.isLoggedIn).toBe(false)
    })

    it('is true when token is set', () => {
      const store = useAuthStore()
      store.token = 'some-token'
      expect(store.isLoggedIn).toBe(true)
    })
  })
})
