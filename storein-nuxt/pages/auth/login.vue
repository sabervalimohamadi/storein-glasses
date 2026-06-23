<template>
  <div class="w-full max-w-sm mx-auto px-4">
    <div class="rounded-2xl shadow-modal p-8" style="background-color: var(--color-card);">

      <div class="text-center mb-8">
        <NuxtLink to="/">
          <div class="inline-flex flex-col items-center">
            <img v-if="settingsStore.logoUrl" :src="settingsStore.logoUrl" :alt="settingsStore.siteName" class="h-12 w-auto mb-2" />
            <svg v-else class="w-12 h-12 text-brand mb-2" viewBox="0 0 48 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="18" height="16" rx="8" />
              <rect x="28" y="4" width="18" height="16" rx="8" />
              <path d="M20 12 Q24 6 28 12" />
            </svg>
            <span class="text-brand font-black text-2xl tracking-tight">{{ settingsStore.siteName }}</span>
            <span class="text-text-secondary text-xs mt-0.5">{{ settingsStore.tagline }}</span>
          </div>
        </NuxtLink>
      </div>

      <div class="mb-6">
        <h1 class="text-xl font-bold text-text-primary mb-1">ورود یا ثبت‌نام</h1>
        <p class="text-text-secondary text-sm">شماره موبایل خود را وارد کنید</p>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-text-primary mb-2">شماره موبایل</label>
        <div :class="['flex items-center border-2 rounded-xl overflow-hidden transition-all duration-150', phoneFocused ? 'border-brand ring-2 ring-brand/20' : 'border-surface-border', phoneError ? 'border-error ring-2 ring-error/10' : '']">
          <input
            v-model="phone"
            ref="phoneInput"
            type="tel"
            inputmode="numeric"
            dir="ltr"
            placeholder="912 345 6789"
            maxlength="11"
            :disabled="authStore.loading"
            class="flex-1 px-4 py-3.5 text-left text-text-primary bg-transparent outline-none placeholder:text-text-disabled font-medium tracking-widest text-base disabled:opacity-50"
            @focus="phoneFocused = true"
            @blur="phoneFocused = false; validatePhone()"
            @keydown.enter="submit"
            @input="phoneError = ''; isBlocked = false"
          />
          <div class="flex items-center gap-1.5 px-3 py-3.5 bg-surface border-r-2 border-surface-border flex-shrink-0">
            <span class="text-lg leading-none">🇮🇷</span>
            <span class="text-text-secondary text-sm font-medium">98+</span>
          </div>
        </div>
        <Transition name="fade-down">
          <p v-if="phoneError" class="text-error text-xs mt-1.5 flex items-center gap-1">{{ phoneError }}</p>
        </Transition>
      </div>

      <Transition name="fade-down">
        <div v-if="isBlocked" class="mb-5 rounded-xl overflow-hidden border border-red-200">
          <div class="bg-red-500 px-4 py-2.5"><span class="text-white text-sm font-bold">حساب کاربری مسدود شده</span></div>
          <div class="bg-red-50 px-4 py-3"><p class="text-red-700 text-xs leading-6">دسترسی به حساب کاربری شما محدود شده است. با پشتیبانی تماس بگیرید.</p></div>
        </div>
      </Transition>

      <button
        @click="submit"
        :disabled="authStore.loading || !phone || isBlocked"
        class="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand-dark active:scale-[0.98] transition-all duration-150 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <BaseSpinner v-if="authStore.loading" size="sm" color="white" />
        <span>{{ authStore.loading ? 'در حال ارسال...' : 'دریافت کد تأیید' }}</span>
      </button>

      <p class="text-center text-text-secondary text-xs mt-5 leading-6">
        با ورود به {{ settingsStore.siteName }}، قوانین و مقررات را می‌پذیرم
      </p>
    </div>
  </div>
</template>

<script setup>
import BaseSpinner from '~/components/common/BaseSpinner.vue'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const router        = useRouter()
const route         = useRoute()
const authStore     = useAuthStore()
const ui            = useUiStore()
const settingsStore = useSettingsStore()

const phone        = ref('')
const phoneError   = ref('')
const phoneFocused = ref(false)
const phoneInput   = ref(null)
const isBlocked    = ref(false)

useSeoMeta({ title: 'ورود یا ثبت‌نام', robots: 'noindex' })

onMounted(() => {
  if (authStore.pendingPhone) phone.value = authStore.pendingPhone
  phoneInput.value?.focus()
})

function validatePhone() {
  const raw = phone.value.replace(/\D/g, '')
  if (!raw) { phoneError.value = 'شماره موبایل را وارد کنید'; return false }
  if (!/^0?9[0-9]{9}$/.test(raw)) { phoneError.value = 'شماره موبایل معتبر نیست (مثال: 09123456789)'; return false }
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
  isBlocked.value = false
  try {
    await authStore.sendOtp(normalized)
    router.push({ path: '/auth/otp', query: route.query.redirect ? { redirect: route.query.redirect } : undefined })
  } catch (err) {
    const status = err.response?.status
    if (status === 403) isBlocked.value = true
    else if (status === 429) phoneError.value = 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً ۱۰ دقیقه صبر کنید.'
    else if (status === 400) phoneError.value = 'شماره موبایل وارد شده معتبر نیست'
    else ui.addToast(err.response?.data?.message || 'خطا در ارسال کد. دوباره تلاش کنید', 'error')
  }
}
</script>

<style scoped>
.fade-down-enter-active, .fade-down-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
