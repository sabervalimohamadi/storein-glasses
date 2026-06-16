<template>
  <div class="max-w-lg">

    <!-- Header -->
    <div class="mb-6">
      <h1 class="page-title">تغییر رمز عبور</h1>
      <p class="text-text-secondary text-sm mt-0.5">فقط ادمین اصلی می‌تواند رمز عبور را تغییر دهد</p>
    </div>

    <!-- Access denied -->
    <div v-if="!auth.isAdmin" class="admin-card p-6 text-center">
      <p class="text-error font-medium">دسترسی غیرمجاز — فقط ادمین می‌تواند رمز عبور را تغییر دهد</p>
    </div>

    <template v-else>

      <!-- Info: no password set yet -->
      <div v-if="noPasswordSet" class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
        <span class="text-amber-500 text-lg mt-0.5">⚠️</span>
        <p class="text-amber-700 text-sm leading-6">رمز عبور برای این حساب هنوز تنظیم نشده است. رمز جدید را وارد کنید.</p>
      </div>

      <!-- Success banner -->
      <div v-if="successMsg" class="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex items-center gap-3">
        <span class="text-green-600 text-xl">✓</span>
        <p class="text-green-700 font-medium text-sm">{{ successMsg }}</p>
      </div>

      <!-- Error banner -->
      <div v-if="errorMsg" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
        <p class="text-error text-sm">{{ errorMsg }}</p>
      </div>

      <div class="admin-card p-6 space-y-5">
        <h3 class="section-title">{{ noPasswordSet ? 'تنظیم رمز عبور' : 'تغییر رمز عبور' }}</h3>

        <!-- Current password — only show when password already exists -->
        <div v-if="!noPasswordSet" class="relative">
          <AdminInput
            v-model="form.currentPassword"
            label="رمز عبور فعلی"
            :type="show.current ? 'text' : 'password'"
            placeholder="رمز عبور فعلی"
            dir="ltr"
            autocomplete="current-password"
            :error="errors.currentPassword"
          />
          <button
            type="button"
            tabindex="-1"
            class="absolute left-3 top-8 text-text-secondary hover:text-primary transition-colors"
            @click="show.current = !show.current"
          >
            <svg v-if="show.current" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <!-- New password -->
        <div class="relative">
          <AdminInput
            v-model="form.newPassword"
            label="رمز عبور جدید"
            :type="show.new ? 'text' : 'password'"
            placeholder="حداقل ۸ کاراکتر"
            dir="ltr"
            autocomplete="new-password"
            :error="errors.newPassword"
          />
          <button
            type="button"
            tabindex="-1"
            class="absolute left-3 top-8 text-text-secondary hover:text-primary transition-colors"
            @click="show.new = !show.new"
          >
            <svg v-if="show.new" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <!-- Confirm new password -->
        <AdminInput
          v-model="form.confirmPassword"
          label="تکرار رمز عبور جدید"
          :type="show.new ? 'text' : 'password'"
          placeholder="رمز عبور جدید را دوباره وارد کنید"
          dir="ltr"
          autocomplete="new-password"
          :error="errors.confirmPassword"
        />

        <div class="flex items-center gap-3 pt-1">
          <AdminButton :loading="loading" @click="handleSubmit">
            {{ noPasswordSet ? 'تنظیم رمز عبور' : 'تغییر رمز عبور' }}
          </AdminButton>
          <button
            type="button"
            class="text-text-secondary text-sm hover:text-text-primary transition-colors"
            @click="resetForm"
          >
            پاک کردن
          </button>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'
import AdminInput  from '@/components/common/AdminInput.vue'
import AdminButton from '@/components/common/AdminButton.vue'

const auth         = useAuthStore()
const loading      = ref(false)
const noPasswordSet = ref(false)

const form   = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const show   = reactive({ current: false, new: false })
const errors = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const errorMsg   = ref('')
const successMsg = ref('')

function resetForm() {
  form.currentPassword   = ''
  form.newPassword       = ''
  form.confirmPassword   = ''
  errors.currentPassword = ''
  errors.newPassword     = ''
  errors.confirmPassword = ''
  errorMsg.value   = ''
  successMsg.value = ''
}

function validate() {
  let ok = true
  errors.currentPassword = ''
  errors.newPassword     = ''
  errors.confirmPassword = ''

  if (!noPasswordSet.value) {
    if (!form.currentPassword || form.currentPassword.length < 6) {
      errors.currentPassword = 'رمز عبور فعلی حداقل ۶ کاراکتر است'
      ok = false
    }
  }
  if (!form.newPassword || form.newPassword.length < 8) {
    errors.newPassword = 'رمز عبور جدید حداقل ۸ کاراکتر است'
    ok = false
  }
  if (!noPasswordSet.value && form.newPassword && form.newPassword === form.currentPassword) {
    errors.newPassword = 'رمز عبور جدید نباید با رمز فعلی یکسان باشد'
    ok = false
  }
  if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = 'تکرار رمز عبور مطابقت ندارد'
    ok = false
  }
  return ok
}

async function handleSubmit() {
  errorMsg.value   = ''
  successMsg.value = ''

  if (!validate()) return

  loading.value = true
  try {
    const currentPw = noPasswordSet.value ? undefined : form.currentPassword
    await authService.changePassword(currentPw, form.newPassword)
    logger.info('Admin password set/changed successfully', { initial: noPasswordSet.value }, 'ChangePasswordView')
    noPasswordSet.value = false
    resetForm()
    successMsg.value = 'رمز عبور با موفقیت تنظیم شد. برای امنیت بیشتر از سایر دستگاه‌ها خارج شدید.'
  } catch (e) {
    logger.error('Admin change password failed', e, {}, 'ChangePasswordView')
    const msg = e.response?.data?.message
    const text = Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در تغییر رمز عبور')
    // Detect "no password set" state from backend error
    if (text.includes('تنظیم نشده') || text.includes('الزامی')) {
      noPasswordSet.value = true
      errorMsg.value = ''
    } else {
      errorMsg.value = text
    }
  } finally {
    loading.value = false
  }
}
</script>
