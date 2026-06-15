<template>
  <div class="w-full max-w-sm">
    <div class="bg-card rounded-2xl shadow-modal p-8">

      <!-- Logo -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
          <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/>
            <path stroke-linecap="round" d="M11 12h2"/>
          </svg>
        </div>
        <h1 class="text-xl font-bold text-text-primary">استورین</h1>
        <p class="text-text-secondary text-sm mt-1">پنل مدیریت</p>
      </div>

      <!-- Mode tabs -->
      <div class="flex rounded-xl border border-border overflow-hidden mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'flex-1 py-2 text-sm font-medium transition-colors duration-150',
            mode === tab.id
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text-primary',
          ]"
          @click="switchMode(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Error banner -->
      <div v-if="errorMsg" class="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
        <p class="text-error text-sm text-center">{{ errorMsg }}</p>
      </div>

      <!-- ── PASSWORD MODE ──────────────────────────────────── -->
      <form v-if="mode === 'password'" @submit.prevent="handlePasswordLogin" autocomplete="off" novalidate>
        <!-- Invisible honeypot — keeps browsers from autofilling real fields -->
        <input type="text"     name="username_fake" style="display:none" tabindex="-1" autocomplete="off" />
        <input type="password" name="password_fake" style="display:none" tabindex="-1" autocomplete="off" />

        <div class="space-y-4">
          <AdminInput
            v-model="phone"
            label="شماره موبایل"
            placeholder="09xxxxxxxxx"
            type="tel"
            dir="ltr"
            autocomplete="off"
            :error="phoneError"
            @enter="handlePasswordLogin"
          />

          <div class="relative">
            <AdminInput
              v-model="password"
              label="رمز عبور"
              placeholder="رمز عبور را وارد کنید"
              :type="showPassword ? 'text' : 'password'"
              dir="ltr"
              autocomplete="new-password"
              :error="passwordError"
              @enter="handlePasswordLogin"
            />
            <button
              type="button"
              tabindex="-1"
              class="absolute left-3 top-8 text-text-secondary hover:text-primary transition-colors"
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

          <AdminButton block :loading="auth.loading" @click="handlePasswordLogin">
            ورود به پنل مدیریت
          </AdminButton>
        </div>
      </form>

      <!-- ── OTP MODE: STEP 1 — phone ──────────────────────── -->
      <div v-else-if="otpStep === 'phone'" class="space-y-4">
        <AdminInput
          v-model="phone"
          label="شماره موبایل"
          placeholder="09xxxxxxxxx"
          type="tel"
          dir="ltr"
          autocomplete="off"
          :error="phoneError"
          @enter="handleSendOtp"
        />
        <AdminButton block :loading="auth.loading" @click="handleSendOtp">
          دریافت کد تأیید
        </AdminButton>
      </div>

      <!-- ── OTP MODE: STEP 2 — code ───────────────────────── -->
      <div v-else class="space-y-4">
        <p class="text-text-secondary text-sm text-center leading-6">
          کد ۶ رقمی ارسال‌شده به
          <span class="font-bold text-text-primary dir-ltr inline-block">{{ maskedPhone }}</span>
          را وارد کنید
        </p>

        <AdminInput
          v-model="otpCode"
          label="کد تأیید"
          placeholder="- - - - - -"
          type="text"
          dir="ltr"
          autocomplete="one-time-code"
          :error="otpError"
          @enter="handleVerifyOtp"
        />

        <div class="text-center text-sm">
          <span v-if="countdown > 0" class="text-text-secondary">
            ارسال مجدد تا
            <span class="font-medium tabular-nums">{{ formattedCountdown }}</span>
          </span>
          <button
            v-else
            class="text-primary hover:underline font-medium"
            @click="handleSendOtp"
          >
            ارسال مجدد کد
          </button>
        </div>

        <AdminButton block :loading="auth.loading" @click="handleVerifyOtp">
          تأیید و ورود
        </AdminButton>

        <button
          class="w-full text-center text-text-secondary text-sm hover:text-text-primary transition-colors"
          @click="otpStep = 'phone'; otpCode = ''; otpError = ''"
        >
          تغییر شماره موبایل
        </button>

        <div v-if="isDev" class="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center text-xs text-amber-700">
          کد OTP را در لاگ‌های Railway بخوانید (MOCK SMS)
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AdminInput  from '@/components/common/AdminInput.vue'
import AdminButton from '@/components/common/AdminButton.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const tabs = [
  { id: 'password', label: 'رمز عبور' },
  { id: 'otp',      label: 'کد تأیید' },
]

// ui state
const mode         = ref('password')
const otpStep      = ref('phone')     // 'phone' | 'code'
const phone        = ref('')
const password     = ref('')
const otpCode      = ref('')
const showPassword = ref(false)
const phoneError   = ref('')
const passwordError = ref('')
const otpError     = ref('')
const errorMsg     = ref(route.query.error === 'forbidden' ? 'دسترسی غیرمجاز' : '')
const countdown    = ref(0)
const isDev        = import.meta.env.DEV

let timer = null

const maskedPhone = computed(() => {
  const p = phone.value
  if (!p || p.length < 8) return p
  return p.slice(0, 4) + ' ' + p.slice(4, 7) + ' ****'
})

const formattedCountdown = computed(() => {
  const m = Math.floor(countdown.value / 60)
  const s = countdown.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function switchMode(m) {
  mode.value       = m
  otpStep.value    = 'phone'
  errorMsg.value   = ''
  phoneError.value = ''
  passwordError.value = ''
  otpError.value   = ''
  otpCode.value    = ''
  clearInterval(timer)
  countdown.value  = 0
}

function startCountdown(seconds = 120) {
  countdown.value = seconds
  clearInterval(timer)
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    else clearInterval(timer)
  }, 1000)
}

function validatePhone(p) {
  return /^09\d{9}$/.test(p)
}

// ── Password login ─────────────────────────────────────────────
async function handlePasswordLogin() {
  phoneError.value    = ''
  passwordError.value = ''
  errorMsg.value      = ''

  const p = phone.value.trim()
  if (!validatePhone(p)) {
    phoneError.value = 'شماره موبایل معتبر نیست'
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
    if (e.isAdminError) { errorMsg.value = e.message; return }
    const msg = e.response?.data?.message
    errorMsg.value = Array.isArray(msg) ? msg[0] : (msg ?? 'شماره یا رمز عبور اشتباه است')
  }
}

// ── OTP login ──────────────────────────────────────────────────
async function handleSendOtp() {
  phoneError.value = ''
  errorMsg.value   = ''

  const p = phone.value.trim()
  if (!validatePhone(p)) {
    phoneError.value = 'شماره موبایل معتبر نیست'
    return
  }

  try {
    await auth.sendOtp(p)
    otpStep.value = 'code'
    startCountdown()
  } catch (e) {
    const msg = e.response?.data?.message
    phoneError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ارسال کد')
  }
}

async function handleVerifyOtp() {
  otpError.value = ''
  errorMsg.value = ''

  const code = otpCode.value.trim()
  if (!code || code.length < 6) {
    otpError.value = 'کد ۶ رقمی را وارد کنید'
    return
  }

  try {
    await auth.verifyOtp(phone.value.trim(), code)
    router.push(route.query.redirect ?? '/dashboard')
  } catch (e) {
    if (e.isAdminError) {
      errorMsg.value = e.message
      otpStep.value  = 'phone'
      otpCode.value  = ''
      return
    }
    const msg = e.response?.data?.message
    otpError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'کد اشتباه است')
  }
}

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dir-ltr { direction: ltr; }
</style>
