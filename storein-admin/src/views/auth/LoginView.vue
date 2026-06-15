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

      <!-- Mode toggle -->
      <div class="flex rounded-xl overflow-hidden border border-border mb-6">
        <button
          :class="['flex-1 py-2 text-sm font-medium transition-colors',
                   mode === 'password' ? 'bg-primary text-white' : 'bg-transparent text-text-secondary hover:text-text-primary']"
          @click="switchMode('password')"
        >رمز عبور</button>
        <button
          :class="['flex-1 py-2 text-sm font-medium transition-colors',
                   mode === 'otp' ? 'bg-primary text-white' : 'bg-transparent text-text-secondary hover:text-text-primary']"
          @click="switchMode('otp')"
        >کد OTP</button>
      </div>

      <!-- Error banner -->
      <div v-if="errorMsg" class="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
        <p class="text-error text-sm text-center">{{ errorMsg }}</p>
      </div>

      <!-- ── PASSWORD MODE ─────────────────────────────────────── -->
      <div v-if="mode === 'password'" class="space-y-4">
        <AdminInput
          v-model="phone"
          label="شماره موبایل"
          placeholder="09xxxxxxxxx"
          type="tel"
          dir="ltr"
          :error="phoneError"
          @enter="handlePasswordLogin"
        />
        <div>
          <AdminInput
            v-model="password"
            label="رمز عبور"
            placeholder="••••••••"
            :type="showPassword ? 'text' : 'password'"
            dir="ltr"
            :error="passwordError"
            @enter="handlePasswordLogin"
          />
          <button type="button"
                  class="text-xs text-text-secondary hover:text-primary mt-1 float-left transition-colors"
                  @click="showPassword = !showPassword">
            {{ showPassword ? 'پنهان کردن' : 'نمایش رمز' }}
          </button>
          <div class="clear-both" />
        </div>
        <AdminButton block :loading="auth.loading" @click="handlePasswordLogin">
          ورود به پنل مدیریت
        </AdminButton>
      </div>

      <!-- ── OTP MODE: STEP 1 ────────────────────────────────── -->
      <div v-else-if="step === 'phone'" class="space-y-4">
        <AdminInput
          v-model="phone"
          label="شماره موبایل"
          placeholder="09xxxxxxxxx"
          type="tel"
          dir="ltr"
          :error="phoneError"
          @enter="handleSendOtp"
        />
        <AdminButton block :loading="auth.loading" @click="handleSendOtp">
          دریافت کد تأیید
        </AdminButton>
      </div>

      <!-- ── OTP MODE: STEP 2 ────────────────────────────────── -->
      <div v-else class="space-y-4">
        <p class="text-text-secondary text-sm text-center">
          کد ۵ رقمی ارسال شده به
          <span class="font-bold text-text-primary font-fanum dir-ltr inline-block">{{ phone }}</span>
          را وارد کنید
        </p>
        <AdminInput
          v-model="otp"
          label="کد تأیید"
          placeholder="- - - - -"
          type="text"
          dir="ltr"
          :error="otpError"
          @enter="handleVerify"
        />
        <div class="text-center text-sm text-text-secondary">
          <span v-if="countdown > 0" class="font-fanum">ارسال مجدد تا {{ countdown }} ثانیه</span>
          <button v-else @click="handleSendOtp" class="text-primary hover:underline">ارسال مجدد کد</button>
        </div>
        <AdminButton block :loading="auth.loading" @click="handleVerify">
          ورود به پنل مدیریت
        </AdminButton>
        <button @click="step = 'phone'; otp = ''; otpError = ''"
                class="w-full text-center text-text-secondary text-sm hover:text-text-primary transition-colors">
          تغییر شماره
        </button>
        <div v-if="isDev" class="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center text-xs text-blue-600">
          کد OTP را در کنسول NestJS ببینید
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AdminInput  from '@/components/common/AdminInput.vue'
import AdminButton from '@/components/common/AdminButton.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

// ui state
const mode         = ref('password')   // 'password' | 'otp'
const step         = ref('phone')      // for OTP mode: 'phone' | 'otp'
const phone        = ref('')
const password     = ref('')
const otp          = ref('')
const showPassword = ref(false)
const phoneError   = ref('')
const passwordError = ref('')
const otpError     = ref('')
const errorMsg     = ref(route.query.error === 'forbidden' ? 'دسترسی غیرمجاز' : '')
const countdown    = ref(0)
const isDev        = import.meta.env.DEV

let timer = null

function switchMode(m) {
  mode.value      = m
  step.value      = 'phone'
  errorMsg.value  = ''
  phoneError.value = ''
  passwordError.value = ''
  otpError.value  = ''
  clearInterval(timer)
  countdown.value = 0
}

function startCountdown() {
  countdown.value = 120
  timer = setInterval(() => { if (countdown.value > 0) countdown.value--; else clearInterval(timer) }, 1000)
}

function validatePhone(p) { return /^09\d{9}$/.test(p) }

// ── Password login ─────────────────────────────────────────────
async function handlePasswordLogin() {
  phoneError.value    = ''
  passwordError.value = ''
  errorMsg.value      = ''
  const p = phone.value.trim()
  if (!validatePhone(p)) { phoneError.value = 'شماره موبایل معتبر نیست (مثال: 09123456789)'; return }
  if (!password.value || password.value.length < 6) { passwordError.value = 'رمز عبور حداقل ۶ کاراکتر است'; return }
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
  if (!validatePhone(p)) { phoneError.value = 'شماره موبایل معتبر نیست (مثال: 09123456789)'; return }
  try {
    await auth.sendOtp(p)
    step.value = 'otp'
    startCountdown()
  } catch (e) {
    phoneError.value = e.response?.data?.message ?? 'خطا در ارسال کد'
  }
}

async function handleVerify() {
  otpError.value = ''
  errorMsg.value = ''
  const code = otp.value.trim()
  if (!code || code.length < 4) { otpError.value = 'کد تأیید را وارد کنید'; return }
  try {
    await auth.verifyOtp(phone.value.trim(), code)
    router.push(route.query.redirect ?? '/dashboard')
  } catch (e) {
    if (e.isAdminError) { errorMsg.value = e.message; step.value = 'phone'; otp.value = '' }
    else { otpError.value = e.response?.data?.message ?? 'کد اشتباه است' }
  }
}

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dir-ltr { direction: ltr; }
</style>
