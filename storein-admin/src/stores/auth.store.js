import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'

export const useAuthStore = defineStore('auth', () => {
  // Access token lives in memory only — never persisted to localStorage (XSS protection)
  const user         = ref(null)
  const token        = ref(null)
  const loading      = ref(false)
  const pendingPhone = ref('')

  const isAdmin     = computed(() => user.value?.isAdmin === true)
  const isManager   = computed(() => user.value?.role === 'manager')
  const isLoggedIn  = computed(() => !!token.value && (user.value?.isAdmin === true || user.value?.role === 'manager'))
  const permissions = computed(() => user.value?.permissions ?? [])

  function hasPermission(perm) {
    if (isAdmin.value) return true
    return permissions.value.includes(perm)
  }

  function hasAdminAccess(profile) {
    return profile?.isAdmin === true || profile?.role === 'manager'
  }

  async function sendOtp(phone) {
    loading.value = true
    try {
      await authService.sendOtp(phone)
      pendingPhone.value = phone
    } catch (error) {
      logger.error('admin-auth: sendOtp failed', error, { phone: phone.slice(0, -4) + '****' }, 'AuthStore')
      throw error
    } finally { loading.value = false }
  }

  async function adminLogin(phone, password) {
    loading.value = true
    const masked = phone.slice(0, -4) + '****'
    try {
      const { data } = await authService.adminLogin(phone, password)
      token.value = data.accessToken
      const { data: profile } = await authService.getProfile()
      if (!hasAdminAccess(profile)) {
        logout()
        throw { isAdminError: true, message: 'شما دسترسی به پنل مدیریت ندارید' }
      }
      user.value = profile
      logger.info('admin-auth: password login success', { phone: masked }, 'AuthStore')
      return data
    } catch (error) {
      logger.error('admin-auth: adminLogin failed', error, { phone: masked }, 'AuthStore')
      throw error
    } finally { loading.value = false }
  }

  async function verifyOtp(phone, code) {
    loading.value = true
    try {
      const { data } = await authService.verifyOtp(phone, code)

      token.value = data.accessToken
      // Refresh token is now an HttpOnly cookie — browser handles it automatically

      const { data: profile } = await authService.getProfile()
      if (!hasAdminAccess(profile)) {
        logout()
        throw { isAdminError: true, message: 'شما دسترسی به پنل مدیریت ندارید' }
      }

      user.value         = profile
      pendingPhone.value = ''
      return data
    } catch (error) {
      logger.error('admin-auth: verifyOtp failed', error, {}, 'AuthStore')
      throw error
    } finally { loading.value = false }
  }

  async function initAuth() {
    // Browser sends the HttpOnly cookie automatically — no localStorage needed
    try {
      const { data } = await authService.refresh()
      token.value = data.accessToken
      const { data: profile } = await authService.getProfile()
      if (!hasAdminAccess(profile)) { logout(); return }
      user.value = profile
    } catch (error) {
      logger.warn('admin-auth: initAuth failed, clearing session', { error: error?.message }, 'AuthStore')
      logout()
    }
  }

  async function fetchProfile() {
    if (!token.value) return
    try {
      const { data } = await authService.getProfile()
      if (!hasAdminAccess(data)) { logout(); return }
      user.value = data
    } catch (error) {
      logger.warn('admin-auth: fetchProfile failed, logging out', { error: error?.message }, 'AuthStore')
      logout()
    }
  }

  async function logout() {
    user.value         = null
    token.value        = null
    pendingPhone.value = ''
    // Cookie is cleared by the server on POST /auth/logout
    const { socketService } = await import('@/services/socket.service')
    socketService.disconnect()
  }

  return { user, token, loading, pendingPhone, isLoggedIn, isAdmin, isManager, permissions, hasPermission, sendOtp, adminLogin, verifyOtp, fetchProfile, initAuth, logout }
})
