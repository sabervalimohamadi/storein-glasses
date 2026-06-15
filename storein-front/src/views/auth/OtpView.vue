<template>
  <div class="w-full max-w-sm mx-auto px-4">

    <!-- Card -->
    <div class="rounded-2xl shadow-modal p-8" style="background-color: var(--color-card);">

      <!-- Logo -->
      <div class="text-center mb-8">
        <RouterLink :to="{ name: 'home' }">
          <div class="inline-flex flex-col items-center">
            <svg class="w-10 h-10 text-brand mb-2" viewBox="0 0 48 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round">
              <rect x="2" y="4" width="18" height="16" rx="8" />
              <rect x="28" y="4" width="18" height="16" rx="8" />
              <path d="M20 12 Q24 6 28 12" />
              <path d="M2 10 Q0 10 0 14" />
              <path d="M46 10 Q48 10 48 14" />
            </svg>
            <span class="text-brand font-black text-xl tracking-tight">استورین</span>
          </div>
        </RouterLink>
      </div>

      <!-- Header -->
      <div class="mb-6 text-center">
        <h1 class="text-xl font-bold text-text-primary mb-2">
          کد تأیید را وارد کنید
        </h1>
        <p class="text-text-secondary text-sm leading-6">
          کد ۶ رقمی به شماره
          <span class="font-bold text-text-primary" dir="ltr">{{ maskedPhone }}</span>
          پیامک شد
        </p>
      </div>

      <!-- OTP boxes -->
      <div class="mb-6">
        <OtpInput
          ref="otpInputRef"
          v-model="otpCode"
          :length="6"
          :error="!!otpError"
          :disabled="authStore.loading"
          @complete="handleComplete"
        />

        <Transition name="fade-down">
          <p v-if="otpError"
             class="text-center text-error text-sm mt-3 flex items-center
                    justify-center gap-1">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2
                   0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1
                   1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ otpError }}
          </p>
        </Transition>
      </div>

      <!-- Verify button -->
      <button
        @click="verify"
        :disabled="otpCode.length < 6 || authStore.loading"
        class="w-full bg-brand text-white font-bold py-3.5 rounded-xl
               hover:bg-brand-dark active:scale-[0.98]
               transition-all duration-150 text-base mb-4
               disabled:opacity-50 disabled:cursor-not-allowed
               flex items-center justify-center gap-2"
      >
        <BaseSpinner v-if="authStore.loading" size="sm" color="white" />
        <span>{{ authStore.loading ? 'در حال بررسی...' : 'تأیید و ورود' }}</span>
      </button>

      <!-- Resend row -->
      <div class="flex items-center justify-center gap-2 text-sm">
        <button
          @click="resend"
          :disabled="cooldown > 0 || authStore.loading"
          :class="[
            'font-medium transition-colors duration-150',
            cooldown > 0
              ? 'text-text-disabled cursor-not-allowed'
              : 'text-brand hover:text-brand-dark',
          ]"
        >
          ارسال مجدد کد
        </button>

        <Transition name="fade">
          <span v-if="cooldown > 0"
                class="text-text-secondary tabular-nums font-medium"
                dir="ltr">
            ({{ formattedCooldown }})
          </span>
        </Transition>
      </div>

      <!-- Back to login -->
      <div class="mt-5 pt-5 border-t border-surface-border text-center">
        <button
          @click="goBack"
          class="text-text-secondary text-sm hover:text-text-primary
                 flex items-center justify-center gap-1.5 mx-auto
                 transition-colors duration-150"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor"
               stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 5l7 7-7 7" />
          </svg>
          ویرایش شماره موبایل
        </button>
      </div>
    </div>

    <!-- Dev hint -->
    <div v-if="isDev"
         class="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <p class="text-yellow-800 text-xs text-center">
        🛠 حالت توسعه — کد OTP را در کنسول بک‌اند ببینید
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore   } from '@/stores/ui.store'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import OtpInput    from './components/OtpInput.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const ui        = useUiStore()

const otpCode    = ref('')
const otpError   = ref('')
const otpInputRef = ref(null)
const isDev = import.meta.env.DEV

// ── Cooldown timer (2 min) ───────────────────────────────────
const RESEND_TIMEOUT = 120
const cooldown = ref(RESEND_TIMEOUT)
let countdownInterval = null

const formattedCooldown = computed(() => {
  const m = Math.floor(cooldown.value / 60)
  const s = cooldown.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function startCountdown() {
  cooldown.value = RESEND_TIMEOUT
  clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    if (cooldown.value > 0) {
      cooldown.value--
    } else {
      clearInterval(countdownInterval)
    }
  }, 1000)
}

// ── Masked phone: "09123456789" → "0912 345 ****" ────────────
const maskedPhone = computed(() => {
  const p = authStore.pendingPhone
  if (!p || p.length < 8) return p
  return p.slice(0, 4) + ' ' + p.slice(4, 7) + ' ' + '****'
})

// ── Guard: no pendingPhone → back to login ───────────────────
onMounted(async () => {
  if (!authStore.pendingPhone) {
    router.replace({ name: 'login' })
    return
  }
  startCountdown()
  await nextTick()
  otpInputRef.value?.focus()
})

onUnmounted(() => {
  clearInterval(countdownInterval)
})

// ── Verify ───────────────────────────────────────────────────
async function verify() {
  if (otpCode.value.length < 6 || authStore.loading) return
  otpError.value = ''

  try {
    await authStore.verifyOtp(authStore.pendingPhone, otpCode.value)
    ui.addToast('خوش آمدید! ورود موفقیت‌آمیز بود', 'success')
    const redirect = route.query.redirect
    router.push(redirect ? String(redirect) : { name: 'home' })
  } catch (err) {
    const status  = err.response?.status
    const message = err.response?.data?.message

    otpCode.value = ''  // clear boxes on error
    if (status === 401) {
      if (message?.includes('منقضی') || message?.includes('expired')) {
        otpError.value = 'کد تأیید منقضی شده. کد جدید دریافت کنید'
      } else {
        otpError.value = 'کد تأیید اشتباه است. مجدداً تلاش کنید'
      }
    } else {
      otpError.value = 'خطا در ورود. لطفاً دوباره تلاش کنید'
    }
    await nextTick()
    otpInputRef.value?.focus()
  }
}

// Auto-submit when all 5 digits are entered
function handleComplete(code) {
  otpCode.value = code
  if (!authStore.loading) verify()
}

// ── Resend ───────────────────────────────────────────────────
async function resend() {
  if (cooldown.value > 0 || authStore.loading) return
  otpError.value = ''
  otpCode.value  = ''

  try {
    await authStore.sendOtp(authStore.pendingPhone)
    startCountdown()
    ui.addToast('کد جدید ارسال شد', 'success')
    await nextTick()
    otpInputRef.value?.focus()
  } catch (err) {
    const status = err.response?.status
    if (status === 429) {
      ui.addToast('لطفاً کمی صبر کنید و دوباره تلاش کنید', 'warning')
    } else {
      ui.addToast('خطا در ارسال کد. دوباره تلاش کنید', 'error')
    }
  }
}

// ── Back ─────────────────────────────────────────────────────
function goBack() {
  clearInterval(countdownInterval)
  router.push({ name: 'login' })
}
</script>

<style scoped>
.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
