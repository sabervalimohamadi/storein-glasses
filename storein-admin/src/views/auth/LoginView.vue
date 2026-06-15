<template>
  <div class="w-full max-w-sm">
    <div class="bg-card rounded-2xl shadow-modal p-8">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
          <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/>
            <path stroke-linecap="round" d="M11 12h2"/>
          </svg>
        </div>
        <h1 class="text-xl font-bold text-text-primary">استورین</h1>
        <p class="text-text-secondary text-sm mt-1">پنل مدیریت</p>
      </div>

      <!-- Error banner -->
      <div v-if="errorMsg" class="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
        <p class="text-error text-sm text-center">{{ errorMsg }}</p>
      </div>

      <!-- Login form -->
      <div class="space-y-4">
        <AdminInput
          v-model="phone"
          label="شماره موبایل"
          placeholder="09xxxxxxxxx"
          type="tel"
          dir="ltr"
          :error="phoneError"
          @enter="handleLogin"
        />

        <div class="relative">
          <AdminInput
            v-model="password"
            label="رمز عبور"
            placeholder="••••••••"
            :type="showPassword ? 'text' : 'password'"
            dir="ltr"
            :error="passwordError"
            @enter="handleLogin"
          />
          <button
            type="button"
            class="absolute left-3 top-8 text-text-secondary hover:text-primary transition-colors"
            tabindex="-1"
            @click="showPassword = !showPassword"
          >
            <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>

        <AdminButton block :loading="auth.loading" @click="handleLogin">
          ورود به پنل مدیریت
        </AdminButton>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AdminInput  from '@/components/common/AdminInput.vue'
import AdminButton from '@/components/common/AdminButton.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const phone         = ref('')
const password      = ref('')
const showPassword  = ref(false)
const phoneError    = ref('')
const passwordError = ref('')
const errorMsg      = ref(route.query.error === 'forbidden' ? 'دسترسی غیرمجاز' : '')

function validatePhone(p) {
  return /^09\d{9}$/.test(p)
}

async function handleLogin() {
  phoneError.value    = ''
  passwordError.value = ''
  errorMsg.value      = ''

  const p = phone.value.trim()
  if (!validatePhone(p)) {
    phoneError.value = 'شماره موبایل معتبر نیست (مثال: 09123456789)'
    return
  }
  if (!password.value || password.value.length < 6) {
    passwordError.value = 'رمز عبور حداقل ۶ کاراکتر است'
    return
  }

  try {
    await auth.adminLogin(p, password.value)
    router.push(route.query.redirect ?? '/dashboard')
  } catch (e) {
    if (e.isAdminError) {
      errorMsg.value = e.message
      return
    }
    const msg = e.response?.data?.message
    errorMsg.value = Array.isArray(msg) ? msg[0] : (msg ?? 'شماره یا رمز عبور اشتباه است')
  }
}
</script>
