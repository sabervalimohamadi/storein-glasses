import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user         = ref(null)
  const token        = ref(localStorage.getItem('admin_token') || null)
  const loading      = ref(false)
  const pendingPhone = ref('')

  const isLoggedIn = computed(() => !!token.value && user.value?.isAdmin === true)

  async function sendOtp(phone) {
    loading.value = true
    try {
      await authService.sendOtp(phone)
      pendingPhone.value = phone
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
      if (!profile.isAdmin) {
        logout()
        throw { isAdminError: true, message: 'شما دسترسی ادمین ندارید' }
      }

      user.value         = profile
      pendingPhone.value = ''
      return data
    } finally { loading.value = false }
  }

  async function fetchProfile() {
    if (!token.value) return
    try {
      const { data } = await authService.getProfile()
      if (!data.isAdmin) { logout(); return }
      user.value = data
    } catch { logout() }
  }

  function logout() {
    user.value         = null
    token.value        = null
    pendingPhone.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
  }

  return { user, token, loading, pendingPhone, isLoggedIn, sendOtp, verifyOtp, fetchProfile, logout }
})
