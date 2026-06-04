<template>
  <div class="w-full max-w-sm mx-auto px-4">

    <!-- Card -->
    <div class="rounded-2xl shadow-modal p-8" style="background-color: var(--color-card);">

      <!-- Logo -->
      <div class="text-center mb-8">
        <RouterLink :to="{ name: 'home' }">
          <div class="inline-flex flex-col items-center">
            <svg class="w-12 h-12 text-brand mb-2" viewBox="0 0 48 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="18" height="16" rx="8" />
              <rect x="28" y="4" width="18" height="16" rx="8" />
              <path d="M20 12 Q24 6 28 12" />
              <path d="M2 10 Q0 10 0 14" />
              <path d="M46 10 Q48 10 48 14" />
            </svg>
            <span class="text-brand font-black text-2xl tracking-tight">استورین</span>
            <span class="text-text-secondary text-xs mt-0.5">فروشگاه تخصصی عینک</span>
          </div>
        </RouterLink>
      </div>

      <!-- Header text -->
      <div class="mb-6">
        <h1 class="text-xl font-bold text-text-primary mb-1">ورود یا ثبت‌نام</h1>
        <p class="text-text-secondary text-sm">
          شماره موبایل خود را وارد کنید
        </p>
      </div>

      <!-- Phone input -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-text-primary mb-2">
          شماره موبایل
        </label>

        <div :class="[
          'flex items-center border-2 rounded-xl overflow-hidden transition-all duration-150',
          phoneFocused ? 'border-brand ring-2 ring-brand/20' : 'border-surface-border',
          phoneError   ? 'border-error ring-2 ring-error/10' : '',
        ]">
          <!-- Phone number input — LTR for correct digit display -->
          <input
            v-model="phone"
            ref="phoneInput"
            type="tel"
            inputmode="numeric"
            dir="ltr"
            placeholder="912 345 6789"
            maxlength="11"
            :disabled="authStore.loading"
            class="flex-1 px-4 py-3.5 text-left text-text-primary bg-transparent
                   outline-none placeholder:text-text-disabled font-medium
                   tracking-widest text-base disabled:opacity-50"
            @focus="phoneFocused = true"
            @blur="phoneFocused = false; validatePhone()"
            @keydown.enter="submit"
            @input="phoneError = ''"
          />

          <!-- Country prefix (static) — left side in RTL -->
          <div class="flex items-center gap-1.5 px-3 py-3.5 bg-surface
                      border-r-2 border-surface-border flex-shrink-0">
            <span class="text-lg leading-none">🇮🇷</span>
            <span class="text-text-secondary text-sm font-medium">98+</span>
          </div>
        </div>

        <Transition name="fade-down">
          <p v-if="phoneError"
             class="text-error text-xs mt-1.5 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2
                   0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1
                   0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ phoneError }}
          </p>
        </Transition>
      </div>

      <!-- Submit button -->
      <button
        @click="submit"
        :disabled="authStore.loading || !phone"
        class="w-full bg-brand text-white font-bold py-3.5 rounded-xl
               hover:bg-brand-dark active:scale-[0.98]
               transition-all duration-150 text-base
               disabled:opacity-50 disabled:cursor-not-allowed
               flex items-center justify-center gap-2"
      >
        <BaseSpinner v-if="authStore.loading" size="sm" color="white" />
        <span>{{ authStore.loading ? 'در حال ارسال...' : 'دریافت کد تأیید' }}</span>
      </button>

      <!-- Terms note -->
      <p class="text-center text-text-disabled text-xs mt-5 leading-6">
        با ورود به استورین،
        <RouterLink to="#" class="text-brand hover:underline">قوانین و مقررات</RouterLink>
        و
        <RouterLink to="#" class="text-brand hover:underline">حریم خصوصی</RouterLink>
        را می‌پذیرم
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore   } from '@/stores/ui.store'
import BaseSpinner from '@/components/common/BaseSpinner.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const ui        = useUiStore()

const phone        = ref('')
const phoneError   = ref('')
const phoneFocused = ref(false)
const phoneInput   = ref(null)

onMounted(() => {
  // Pre-fill if user navigated back from OTP page
  if (authStore.pendingPhone) phone.value = authStore.pendingPhone
  phoneInput.value?.focus()
})

function validatePhone() {
  const raw = phone.value.replace(/\D/g, '')
  if (!raw) {
    phoneError.value = 'شماره موبایل را وارد کنید'
    return false
  }
  if (!/^0?9[0-9]{9}$/.test(raw)) {
    phoneError.value = 'شماره موبایل معتبر نیست (مثال: 09123456789)'
    return false
  }
  phoneError.value = ''
  return true
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('9') && digits.length === 10) return '0' + digits
  return digits
}

async function submit() {
  if (authStore.loading) return
  if (!validatePhone()) return

  const normalized = normalizePhone(phone.value)

  try {
    await authStore.sendOtp(normalized)
    router.push({
      name: 'otp',
      query: route.query.redirect ? { redirect: route.query.redirect } : undefined,
    })
  } catch (err) {
    const status  = err.response?.status
    const message = err.response?.data?.message

    if (status === 429) {
      phoneError.value = 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً ۱۰ دقیقه صبر کنید.'
    } else if (status === 400) {
      phoneError.value = 'شماره موبایل وارد شده معتبر نیست'
    } else {
      ui.addToast(message || 'خطا در ارسال کد. دوباره تلاش کنید', 'error')
    }
  }
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
</style>
