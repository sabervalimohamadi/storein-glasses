<template>
  <div class="w-full max-w-sm mx-auto px-4">

    <!-- Card -->
    <div class="rounded-2xl shadow-modal px-6 py-8" style="background-color: var(--color-card);">

      <!-- Logo -->
      <div class="flex flex-col items-center mb-8">
        <RouterLink :to="{ name: 'home' }" class="flex flex-col items-center gap-2">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
               style="background-color: var(--color-brand); opacity: 1;">
            <svg class="w-8 h-8 text-white" viewBox="0 0 48 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="18" height="16" rx="8" />
              <rect x="28" y="4" width="18" height="16" rx="8" />
              <path d="M20 12 Q24 6 28 12" />
              <path d="M2 10 Q0 10 0 14" />
              <path d="M46 10 Q48 10 48 14" />
            </svg>
          </div>
          <span class="text-brand font-black text-xl tracking-tight">استورین</span>
        </RouterLink>
      </div>

      <!-- Header -->
      <div class="mb-7 text-center">
        <h1 class="text-xl font-bold text-text-primary mb-3">کد تأیید را وارد کنید</h1>
        <!-- Phone badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
             style="background-color: var(--color-bg); border: 1px solid var(--color-border);">
          <svg class="w-4 h-4 flex-shrink-0" style="color: var(--color-text-secondary);"
               fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3v.008h-3v-.008zm0 3h3v.008h-3v-.008zm0 3h3v.008h-3v-.008z"/>
          </svg>
          <span style="color: var(--color-text-secondary);">کد ۶ رقمی ارسال شد به</span>
          <span class="font-bold" style="color: var(--color-text-primary);" dir="ltr">{{ maskedPhone }}</span>
        </div>
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
             class="text-center text-error text-sm mt-3 flex items-center justify-center gap-1.5">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd" />
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
               hover:opacity-90 active:scale-[0.98]
               transition-all duration-150 text-base mb-5
               disabled:opacity-50 disabled:cursor-not-allowed
               flex items-center justify-center gap-2"
      >
        <BaseSpinner v-if="authStore.loading" size="sm" color="white" />
        <span>{{ authStore.loading ? 'در حال بررسی...' : 'تأیید و ورود' }}</span>
      </button>

      <!-- Resend row -->
      <div class="flex items-center justify-center gap-3 text-sm">
        <button
          @click="resend"
          :disabled="cooldown > 0 || authStore.loading"
          :class="[
            'font-medium transition-colors duration-150',
            cooldown > 0
              ? 'text-text-disabled cursor-not-allowed'
              : 'text-brand hover:opacity-80',
          ]"
        >
          ارسال مجدد کد
        </button>

        <Transition name="fade">
          <span v-if="cooldown > 0"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums"
                style="background-color: var(--color-bg); color: var(--color-text-secondary);"
                dir="ltr">
            <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor"
                 stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 6v6l4 2M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
            </svg>
            {{ formattedCooldown }}
          </span>
        </Transition>
      </div>

      <!-- Back to login -->
      <div class="mt-6 pt-5 border-t border-surface-border text-center">
        <button
          @click="goBack"
          class="text-text-secondary text-sm hover:text-brand
                 inline-flex items-center gap-1.5 mx-auto transition-colors duration-150"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor"
               stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          ویرایش شماره موبایل
        </button>
      </div>
    </div>

    <!-- Dev hint -->
    <div v-if="isDev"
         class="mt-4 rounded-xl p-3.5 flex items-center gap-2.5 text-xs"
         style="background-color: var(--color-bg); border: 1px solid var(--color-border);">
      <svg class="w-4 h-4 flex-shrink-0 text-brand" fill="none" stroke="currentColor"
           stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472c.53-.53.53-1.39 0-1.92L9.126 6.1A2.652 2.652 0 005.37 9.857l4.773 4.773c.53.53 1.39.53 1.92 0z"/>
      </svg>
      <span style="color: var(--color-text-secondary);">
        حالت توسعه — کد OTP را در کنسول بک‌اند ببینید
      </span>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore   } from '@/stores/ui.store'
import { logger }       from '@/utils/logger'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import OtpInput    from './components/OtpInput.vue'

const CTX = 'OtpView'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const ui        = useUiStore()

const otpCode     = ref('')
const otpError    = ref('')
const otpInputRef = ref(null)
const isDev = import.meta.env.DEV

// ── Cooldown timer ──────────────────────────────────────────────
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

// ── Masked phone ────────────────────────────────────────────────
const maskedPhone = computed(() => {
  const p = authStore.pendingPhone
  if (!p || p.length < 8) return p
  return p.slice(0, 4) + ' ' + p.slice(4, 7) + ' ' + '****'
})

// ── Guard ───────────────────────────────────────────────────────
onMounted(async () => {
  if (!authStore.pendingPhone) {
    logger.warn('OTP: no pending phone, redirecting to login', {}, CTX)
    router.replace({ name: 'login' })
    return
  }
  logger.debug('OTP: view mounted, starting countdown', { phone: maskedPhone.value }, CTX)
  startCountdown()
  await nextTick()
  otpInputRef.value?.focus()
})

onUnmounted(() => {
  clearInterval(countdownInterval)
})

// ── Verify ──────────────────────────────────────────────────────
async function verify() {
  if (otpCode.value.length < 6 || authStore.loading) return
  otpError.value = ''

  try {
    await authStore.verifyOtp(authStore.pendingPhone, otpCode.value)
    logger.info('OTP: verification successful', {}, CTX)
    ui.addToast('خوش آمدید! ورود موفقیت‌آمیز بود', 'success')
    const redirect = route.query.redirect
    router.push(redirect ? String(redirect) : { name: 'home' })
  } catch (err) {
    const status  = err.response?.status
    const message = err.response?.data?.message
    logger.warn('OTP: verification failed', { status }, CTX)

    otpCode.value = ''
    if (status === 401) {
      otpError.value = message?.includes('منقضی') || message?.includes('expired')
        ? 'کد تأیید منقضی شده. کد جدید دریافت کنید'
        : 'کد تأیید اشتباه است. مجدداً تلاش کنید'
    } else {
      otpError.value = 'خطا در ورود. لطفاً دوباره تلاش کنید'
    }
    await nextTick()
    otpInputRef.value?.focus()
  }
}

function handleComplete(code) {
  otpCode.value = code
  logger.debug('OTP: auto-submitting on complete', {}, CTX)
  if (!authStore.loading) verify()
}

// ── Resend ──────────────────────────────────────────────────────
async function resend() {
  if (cooldown.value > 0 || authStore.loading) return
  otpError.value = ''
  otpCode.value  = ''
  logger.debug('OTP: resending code', { phone: maskedPhone.value }, CTX)

  try {
    await authStore.sendOtp(authStore.pendingPhone)
    startCountdown()
    logger.info('OTP: code resent successfully', {}, CTX)
    ui.addToast('کد جدید ارسال شد', 'success')
    await nextTick()
    otpInputRef.value?.focus()
  } catch (err) {
    const status = err.response?.status
    logger.warn('OTP: resend failed', { status }, CTX)
    if (status === 429) {
      ui.addToast('لطفاً کمی صبر کنید و دوباره تلاش کنید', 'warning')
    } else {
      ui.addToast('خطا در ارسال کد. دوباره تلاش کنید', 'error')
    }
  }
}

// ── Back ────────────────────────────────────────────────────────
function goBack() {
  clearInterval(countdownInterval)
  logger.debug('OTP: navigating back to login', {}, CTX)
  router.push({ name: 'login' })
}
</script>

<style scoped>
.fade-down-enter-active,
.fade-down-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-down-enter-from,
.fade-down-leave-to    { opacity: 0; transform: translateY(-4px); }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }
</style>
