import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const token   = ref(localStorage.getItem('access_token') || null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  async function sendOtp(phone) {
    loading.value = true
    try   { await authService.sendOtp(phone) }
    finally { loading.value = false }
  }

  async function verifyOtp(phone, code) {
    loading.value = true
    try {
      const { data } = await authService.verifyOtp(phone, code)
      token.value = data.access_token
      user.value  = data.user
      localStorage.setItem('access_token', data.access_token)
    } finally { loading.value = false }
  }

  async function fetchProfile() {
    if (!token.value) return
    const { data } = await authService.getProfile()
    user.value = data
  }

  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem('access_token')
  }

  return { user, token, loading, isLoggedIn, sendOtp, verifyOtp, fetchProfile, logout }
})
