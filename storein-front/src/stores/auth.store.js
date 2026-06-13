import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'

export const useAuthStore = defineStore('auth', () => {
  const user         = ref(null)
  const token        = ref(localStorage.getItem('access_token') || null)
  const loading      = ref(false)
  const pendingPhone = ref('')    // carried from LoginView → OtpView

  const isLoggedIn = computed(() => !!token.value)

  // ── Send OTP ─────────────────────────────────────────────────
  async function sendOtp(phone) {
    loading.value = true
    try {
      await authService.sendOtp(phone)
      pendingPhone.value = phone
    } catch (error) {
      logger.error('auth: sendOtp failed', error, {}, 'AuthStore')
      throw error
    } finally {
      loading.value = false
    }
  }

  // ── Verify OTP ───────────────────────────────────────────────
  async function verifyOtp(phone, code) {
    loading.value = true
    try {
      const { data } = await authService.verifyOtp(phone, code)
      token.value = data.accessToken
      localStorage.setItem('access_token', data.accessToken)
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken)
      }
      await fetchProfile()
      pendingPhone.value = ''
      await _postLoginSync()
      return data
    } catch (error) {
      logger.error('auth: verifyOtp failed', error, {}, 'AuthStore')
      throw error
    } finally {
      loading.value = false
    }
  }

  // ── Post-login: sync cart + wishlist in background ───────────
  async function _postLoginSync() {
    const { useCartStore }     = await import('@/stores/cart.store')
    const { useWishlistStore } = await import('@/stores/wishlist.store')
    Promise.allSettled([
      useCartStore().fetchCart(),
      useWishlistStore().fetchWishlist(),
    ])
  }

  // ── Fetch profile ────────────────────────────────────────────
  async function fetchProfile() {
    if (!token.value) return
    try {
      const { data } = await authService.getProfile()
      user.value = data
    } catch {
      // Token expired — http interceptor handles redirect
    }
  }

  // ── Logout ───────────────────────────────────────────────────
  async function logout() {
    try { await authService.logout() } catch { /* silent */ }
    user.value         = null
    token.value        = null
    pendingPhone.value = ''
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    const { useCartStore }     = await import('@/stores/cart.store')
    const { useWishlistStore } = await import('@/stores/wishlist.store')
    useCartStore().items           = []
    useWishlistStore().wishlistIds = new Set()
  }

  // ── Init (called once on app startup) ────────────────────────
  async function initAuth() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!token.value && !refreshToken) return

    // No access token but we have a refresh token — silently obtain a new one
    if (!token.value && refreshToken) {
      try {
        const { data } = await authService.refresh()
        token.value = data.accessToken
        localStorage.setItem('access_token', data.accessToken)
        if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken)
      } catch {
        localStorage.removeItem('refresh_token')
        return
      }
    }

    // Fetch profile — if access token is expired the http interceptor handles refresh
    await fetchProfile()

    // Load cart + wishlist in background once we know the user
    if (user.value) _postLoginSync()
  }

  return {
    user, token, loading, pendingPhone,
    isLoggedIn,
    sendOtp, verifyOtp, fetchProfile, logout, initAuth,
  }
})
