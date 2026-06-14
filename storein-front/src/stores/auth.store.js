import { defineStore }    from 'pinia'
import { ref, computed }  from 'vue'
import { authService }    from '@/services/auth.service'
import { setTokenProvider } from '@/services/http.service'
import { logger }         from '@/utils/logger'

export const useAuthStore = defineStore('auth', () => {
  // ── State ─────────────────────────────────────────────────────
  const user         = ref(null)
  const token        = ref(null)   // access token lives in memory ONLY — never localStorage
  const loading      = ref(false)
  const pendingPhone = ref('')

  // Register token provider so http.service can read it without circular import
  setTokenProvider(() => token.value)

  // ── Computed ──────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value)

  // ── Send OTP ──────────────────────────────────────────────────
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

  // ── Verify OTP ────────────────────────────────────────────────
  async function verifyOtp(phone, code) {
    loading.value = true
    try {
      const { data } = await authService.verifyOtp(phone, code)

      token.value = data.accessToken
      // refresh_token is an HttpOnly cookie set by the server — never touch it here

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

  // ── Post-login background sync ────────────────────────────────
  async function _postLoginSync() {
    const { useCartStore }     = await import('@/stores/cart.store')
    const { useWishlistStore } = await import('@/stores/wishlist.store')
    Promise.allSettled([
      useCartStore().fetchCart(),
      useWishlistStore().fetchWishlist(),
    ])
  }

  // ── Fetch profile ─────────────────────────────────────────────
  async function fetchProfile() {
    if (!token.value) return
    try {
      const { data } = await authService.getProfile()
      user.value = data
    } catch {
      // Token expired — 401 interceptor in http.service handles refresh
    }
  }

  // ── Logout ────────────────────────────────────────────────────
  async function logout() {
    try {
      // Server clears the HttpOnly cookie via Set-Cookie: refresh_token=; Max-Age=0
      await authService.logout()
    } catch { /* silent */ }

    user.value         = null
    token.value        = null
    pendingPhone.value = ''
    // No localStorage to clean — tokens were never stored there

    const { useCartStore }     = await import('@/stores/cart.store')
    const { useWishlistStore } = await import('@/stores/wishlist.store')
    useCartStore().items           = []
    useWishlistStore().wishlistIds = new Set()
  }

  // ── Init (called once on app startup) ─────────────────────────
  async function initAuth() {
    // withCredentials:true means the browser sends the HttpOnly cookie automatically.
    // If the cookie is valid, the server returns a new access token.
    try {
      const { data } = await authService.refresh()
      token.value = data.accessToken
      await fetchProfile()
      if (user.value) _postLoginSync()
    } catch {
      token.value = null
      user.value  = null
    }
  }

  return {
    user, token, loading, pendingPhone,
    isLoggedIn,
    sendOtp, verifyOtp, fetchProfile, logout, initAuth,
  }
})
