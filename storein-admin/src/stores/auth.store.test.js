import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/auth.service', () => ({
  authService: {
    sendOtp:    vi.fn(),
    verifyOtp:  vi.fn(),
    refresh:    vi.fn(),
    getProfile: vi.fn(),
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('@/services/socket.service', () => ({
  socketService: { disconnect: vi.fn() },
}))

import { useAuthStore } from './auth.store'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'

const adminProfile   = { _id: 'u1', isAdmin: true,  role: 'admin',   name: 'Admin' }
const managerProfile = { _id: 'u2', isAdmin: false, role: 'manager', name: 'Mgr'   }
const userProfile    = { _id: 'u3', isAdmin: false, role: 'user',    name: 'User'  }

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('sendOtp', () => {
    it('calls authService.sendOtp and sets pendingPhone', async () => {
      authService.sendOtp.mockResolvedValue({})
      const store = useAuthStore()
      await store.sendOtp('09123456789')
      expect(authService.sendOtp).toHaveBeenCalledWith('09123456789')
      expect(store.pendingPhone).toBe('09123456789')
      expect(store.loading).toBe(false)
    })

    it('logs error and re-throws on failure', async () => {
      const err = new Error('network error')
      authService.sendOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await expect(store.sendOtp('09123456789')).rejects.toThrow('network error')
      expect(logger.error).toHaveBeenCalledWith(
        'admin-auth: sendOtp failed', err,
        expect.objectContaining({ phone: expect.stringContaining('****') }),
        'AuthStore',
      )
      expect(store.loading).toBe(false)
    })

    it('masks phone number in log', async () => {
      const err = new Error('fail')
      authService.sendOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await store.sendOtp('09123456789').catch(() => {})
      const [, , meta] = logger.error.mock.calls[0]
      expect(meta.phone).toBe('0912345****')
    })
  })

  describe('verifyOtp', () => {
    it('stores accessToken in memory (not localStorage) on success', async () => {
      authService.verifyOtp.mockResolvedValue({
        data: { accessToken: 'tok123', isNewUser: false },
      })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      await store.verifyOtp('09123456789', '1234')

      expect(store.token).toBe('tok123')
      // Refresh token is HttpOnly cookie — no localStorage entry
      expect(localStorage.getItem('admin_refresh_token')).toBeNull()
      expect(store.user).toEqual(adminProfile)
      expect(store.isAdmin).toBe(true)
      expect(store.isLoggedIn).toBe(true)
    })

    it('accepts manager role', async () => {
      authService.verifyOtp.mockResolvedValue({
        data: { accessToken: 'mgr-tok' },
      })
      authService.getProfile.mockResolvedValue({ data: managerProfile })

      const store = useAuthStore()
      await store.verifyOtp('09123456789', '1234')

      expect(store.isManager).toBe(true)
      expect(store.isLoggedIn).toBe(true)
    })

    it('throws isAdminError when profile has no admin access', async () => {
      authService.verifyOtp.mockResolvedValue({
        data: { accessToken: 'tok' },
      })
      authService.getProfile.mockResolvedValue({ data: userProfile })

      const store = useAuthStore()
      const err = await store.verifyOtp('09123456789', '1234').catch(e => e)
      expect(err.isAdminError).toBe(true)
    })

    it('logs error and re-throws on API failure', async () => {
      const err = new Error('401')
      authService.verifyOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await expect(store.verifyOtp('09123456789', '1234')).rejects.toThrow('401')
      expect(logger.error).toHaveBeenCalledWith(
        'admin-auth: verifyOtp failed', err, {}, 'AuthStore',
      )
    })
  })

  describe('initAuth', () => {
    it('restores session via cookie (no localStorage needed)', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'restored' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      await store.initAuth()

      expect(authService.refresh).toHaveBeenCalled()
      expect(store.token).toBe('restored')
      expect(store.user).toEqual(adminProfile)
    })

    it('logs out when refresh fails', async () => {
      authService.refresh.mockRejectedValue(new Error('expired'))

      const store = useAuthStore()
      store.token = 'old'
      await store.initAuth()

      expect(store.token).toBeNull()
      expect(logger.warn).toHaveBeenCalledWith(
        'admin-auth: initAuth failed, clearing session',
        expect.any(Object),
        'AuthStore',
      )
    })
  })

  describe('fetchProfile', () => {
    it('skips when no token', async () => {
      const store = useAuthStore()
      store.token = null
      await store.fetchProfile()
      expect(authService.getProfile).not.toHaveBeenCalled()
    })

    it('sets user on success', async () => {
      authService.getProfile.mockResolvedValue({ data: adminProfile })
      const store = useAuthStore()
      store.token = 'existing-token'
      await store.fetchProfile()
      expect(store.user).toEqual(adminProfile)
    })

    it('logs warn and logs out when profile fetch fails', async () => {
      authService.getProfile.mockRejectedValue(new Error('expired'))
      const store = useAuthStore()
      store.token = 'bad-token'
      await store.fetchProfile()
      expect(logger.warn).toHaveBeenCalledWith(
        'admin-auth: fetchProfile failed, logging out',
        expect.any(Object),
        'AuthStore',
      )
      expect(store.token).toBeNull()
    })
  })

  describe('hasPermission', () => {
    it('admin always returns true', () => {
      const store = useAuthStore()
      store.user = adminProfile
      expect(store.hasPermission('anything')).toBe(true)
    })

    it('non-admin checks permissions array', () => {
      const store = useAuthStore()
      store.user = { ...userProfile, permissions: ['orders:read'] }
      expect(store.hasPermission('orders:read')).toBe(true)
      expect(store.hasPermission('orders:write')).toBe(false)
    })
  })

  describe('logout', () => {
    it('clears user and token from memory — no localStorage involved', async () => {
      const store = useAuthStore()
      store.user  = adminProfile
      store.token = 'tok'
      await store.logout()
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      // Cookie is cleared server-side; no localStorage entry should exist
      expect(localStorage.getItem('admin_refresh_token')).toBeNull()
    })
  })
})
