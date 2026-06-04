<template>
  <div class="w-full max-w-sm">
    <div class="bg-white rounded-2xl shadow-modal p-8">

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

      <!-- STEP 1: Phone -->
      <div v-if="step === 'phone'" class="space-y-4">
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

      <!-- STEP 2: OTP -->
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

        <!-- Countdown -->
        <div class="text-center text-sm text-text-secondary">
          <span v-if="countdown > 0" class="font-fanum">
            ارسال مجدد تا {{ countdown }} ثانیه
          </span>
          <button v-else @click="handleSendOtp" class="text-primary hover:underline">
            ارسال مجدد کد
          </button>
        </div>

        <AdminButton block :loading="auth.loading" @click="handleVerify">
          ورود به پنل مدیریت
        </AdminButton>

        <button @click="step = 'phone'; otp = ''; otpError = ''"
                class="w-full text-center text-text-secondary text-sm hover:text-text-primary transition-colors">
          تغییر شماره
        </button>

        <!-- Dev helper -->
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
import { useUiStore }   from '@/stores/ui.store'
import AdminInput       from '@/components/common/AdminInput.vue'
import AdminButton      from '@/components/common/AdminButton.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const ui     = useUiStore()

const step      = ref('phone')
const phone     = ref('')
const otp       = ref('')
const phoneError = ref('')
const otpError  = ref('')
const errorMsg  = ref(route.query.error === 'forbidden' ? 'دسترسی غیرمجاز' : '')
const countdown = ref(0)
const isDev     = import.meta.env.DEV

let timer = null

function startCountdown() {
  countdown.value = 120
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    else clearInterval(timer)
  }, 1000)
}

function validatePhone(p) {
  return /^09\d{9}$/.test(p)
}

async function handleSendOtp() {
  phoneError.value = ''
  errorMsg.value   = ''
  const p = phone.value.trim()
  if (!validatePhone(p)) {
    phoneError.value = 'شماره موبایل معتبر نیست (مثال: 09123456789)'
    return
  }
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
  if (!code || code.length < 4) {
    otpError.value = 'کد تأیید را وارد کنید'
    return
  }
  try {
    await auth.verifyOtp(phone.value.trim(), code)
    const redirect = route.query.redirect ?? '/dashboard'
    router.push(redirect)
  } catch (e) {
    if (e.isAdminError) {
      errorMsg.value = e.message
      step.value = 'phone'
      otp.value  = ''
    } else {
      otpError.value = e.response?.data?.message ?? 'کد اشتباه است'
    }
  }
}

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dir-ltr { direction: ltr; }
</style>
