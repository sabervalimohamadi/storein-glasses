import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'

export const useAuthStore = defineStore('auth', () => {
  const user         = ref(null)
  const token        = ref(localStorage.getItem('admin_token') || null)
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

  async function verifyOtp(phone, code) {
    loading.value = true
    try {
      const { data } = await authService.verifyOtp(phone, code)

      token.value = data.accessToken
      localStorage.setItem('admin_token', data.accessToken)
      if (data.refreshToken)
        localStorage.setItem('admin_refresh_token', data.refreshToken)

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
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    const { socketService } = await import('@/services/socket.service')
    socketService.disconnect()
  }

  return { user, token, loading, pendingPhone, isLoggedIn, isAdmin, isManager, permissions, hasPermission, sendOtp, verifyOtp, fetchProfile, logout }
})
