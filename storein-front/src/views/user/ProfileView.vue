<template>
  <div class="container-main py-8">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">

      <!-- ── Sidebar ── -->
      <aside class="lg:col-span-1">
        <!-- Avatar card -->
        <div
          class="rounded-2xl border border-surface-border p-6 flex flex-col items-center gap-3 mb-4"
          style="background-color: var(--color-card)"
        >
          <div class="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white text-2xl font-bold select-none">
            {{ initials }}
          </div>
          <div class="text-center">
            <p class="font-bold text-text-primary text-base">
              {{ fullName || 'کاربر عزیز' }}
            </p>
            <p class="text-text-secondary text-sm font-fanum mt-0.5 dir-ltr text-center">
              {{ authStore.user?.phone }}
            </p>
          </div>
          <span v-if="authStore.user?.isAdmin" class="text-xs bg-brand/10 text-brand px-3 py-1 rounded-full font-medium">
            ادمین
          </span>
        </div>

        <!-- Nav links -->
        <nav
          class="rounded-2xl border border-surface-border overflow-hidden"
          style="background-color: var(--color-card)"
        >
          <RouterLink
            v-for="link in navLinks" :key="link.name"
            :to="{ name: link.name }"
            class="flex items-center gap-3 px-4 py-3.5 text-sm border-b border-surface-border last:border-0 transition-colors"
            :class="$route.name === link.name
              ? 'text-brand bg-brand/5 font-medium'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'"
          >
            <span class="text-base">{{ link.icon }}</span>
            {{ link.label }}
          </RouterLink>

          <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-error hover:bg-red-50/5 transition-colors"
          >
            <span class="text-base">🚪</span>
            خروج از حساب
          </button>
        </nav>
      </aside>

      <!-- ── Main content ── -->
      <div class="lg:col-span-3 flex flex-col gap-6">

        <!-- Profile edit form -->
        <section
          class="rounded-2xl border border-surface-border p-6"
          style="background-color: var(--color-card)"
        >
          <h2 class="text-base font-bold text-text-primary mb-5 pb-4 border-b border-surface-border">
            ویرایش اطلاعات شخصی
          </h2>

          <form @submit.prevent="handleSave" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- First name -->
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">نام</label>
                <input
                  v-model="form.firstName"
                  type="text"
                  placeholder="نام خود را وارد کنید"
                  maxlength="50"
                  class="input-field"
                  :disabled="saving"
                />
              </div>

              <!-- Last name -->
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">نام خانوادگی</label>
                <input
                  v-model="form.lastName"
                  type="text"
                  placeholder="نام خانوادگی خود را وارد کنید"
                  maxlength="50"
                  class="input-field"
                  :disabled="saving"
                />
              </div>
            </div>

            <!-- Email -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">ایمیل</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="example@email.com"
                dir="ltr"
                class="input-field text-left"
                :class="emailError ? 'border-error' : ''"
                :disabled="saving"
                @blur="validateEmail"
              />
              <p v-if="emailError" class="text-error text-xs">{{ emailError }}</p>
            </div>

            <!-- Phone (readonly) -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">شماره موبایل</label>
              <div class="input-field bg-surface text-text-disabled cursor-not-allowed font-fanum dir-ltr text-left flex items-center">
                {{ authStore.user?.phone }}
                <span class="mr-auto text-xs text-text-disabled">(قابل تغییر نیست)</span>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                type="submit"
                :disabled="saving || !isDirty"
                class="btn-brand px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {{ saving ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}
              </button>
              <button
                v-if="isDirty"
                type="button"
                @click="resetForm"
                class="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                انصراف
              </button>
            </div>
          </form>
        </section>

        <!-- Account info -->
        <section
          class="rounded-2xl border border-surface-border p-6"
          style="background-color: var(--color-card)"
        >
          <h2 class="text-base font-bold text-text-primary mb-4 pb-4 border-b border-surface-border">
            اطلاعات حساب کاربری
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div
              v-for="stat in accountStats" :key="stat.label"
              class="flex flex-col gap-1 p-4 rounded-xl bg-surface border border-surface-border"
            >
              <span class="text-xl">{{ stat.icon }}</span>
              <span class="text-lg font-bold text-text-primary font-fanum">{{ stat.value }}</span>
              <span class="text-xs text-text-secondary">{{ stat.label }}</span>
            </div>
          </div>
        </section>

        <!-- Quick actions -->
        <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RouterLink
            v-for="action in quickActions" :key="action.name"
            :to="{ name: action.name }"
            class="flex items-center gap-3 p-4 rounded-2xl border border-surface-border hover:border-brand/40 transition-all group"
            style="background-color: var(--color-card)"
          >
            <span class="text-2xl">{{ action.icon }}</span>
            <div>
              <p class="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">{{ action.label }}</p>
              <p class="text-xs text-text-secondary">{{ action.desc }}</p>
            </div>
            <svg class="w-4 h-4 text-text-disabled mr-auto group-hover:text-brand transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </RouterLink>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore }   from '@/stores/ui.store'
import { userService }  from '@/services/user.service'

const authStore = useAuthStore()
const ui        = useUiStore()

// ── Form state ──────────────────────────────────────────────────
const form = ref({
  firstName: '',
  lastName:  '',
  email:     '',
})
const saving     = ref(false)
const emailError = ref('')

function fillForm(u) {
  form.value = {
    firstName: u?.firstName || '',
    lastName:  u?.lastName  || '',
    email:     u?.email     || '',
  }
}

// Sync form when user data arrives
watch(() => authStore.user, (u) => fillForm(u), { immediate: true })

const isDirty = computed(() => {
  const u = authStore.user
  return form.value.firstName !== (u?.firstName || '')
      || form.value.lastName  !== (u?.lastName  || '')
      || form.value.email     !== (u?.email     || '')
})

function resetForm() {
  fillForm(authStore.user)
  emailError.value = ''
}

function validateEmail() {
  const v = form.value.email
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    emailError.value = 'ایمیل معتبر نیست'
  } else {
    emailError.value = ''
  }
}

async function handleSave() {
  validateEmail()
  if (emailError.value) return

  saving.value = true
  try {
    const payload = {}
    if (form.value.firstName !== (authStore.user?.firstName || '')) payload.firstName = form.value.firstName
    if (form.value.lastName  !== (authStore.user?.lastName  || '')) payload.lastName  = form.value.lastName
    if (form.value.email     !== (authStore.user?.email     || '')) payload.email      = form.value.email

    const { data } = await userService.updateProfile(payload)
    authStore.user = data
    ui.addToast('اطلاعات با موفقیت ذخیره شد', 'success')
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg || 'خطا در ذخیره اطلاعات'), 'error')
  } finally {
    saving.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
}

// ── Computed helpers ─────────────────────────────────────────────
const fullName = computed(() => {
  const u = authStore.user
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ')
})

const initials = computed(() => {
  if (authStore.user?.firstName) return authStore.user.firstName[0]
  if (authStore.user?.phone)     return authStore.user.phone.slice(-2)
  return '؟'
})

const accountStats = computed(() => [
  { icon: '📱', label: 'شماره موبایل', value: authStore.user?.phone || '—' },
  { icon: '✅', label: 'وضعیت حساب',  value: authStore.user?.isActive ? 'فعال' : 'غیرفعال' },
  { icon: '🏠', label: 'آدرس‌های ذخیره', value: (authStore.user?.addresses?.length || 0) + ' آدرس' },
])

const navLinks = [
  { name: 'user-profile',   icon: '👤', label: 'اطلاعات شخصی' },
  { name: 'user-orders',    icon: '📦', label: 'سفارش‌های من' },
  { name: 'user-favorites', icon: '❤️', label: 'علاقه‌مندی‌ها' },
  { name: 'user-addresses', icon: '🏠', label: 'آدرس‌های من' },
]

onMounted(() => authStore.fetchProfile())

const quickActions = [
  { name: 'user-orders',    icon: '📦', label: 'سفارش‌های من',    desc: 'پیگیری و مشاهده سفارشات' },
  { name: 'user-addresses', icon: '🏠', label: 'آدرس‌های من',    desc: 'مدیریت آدرس‌های تحویل' },
  { name: 'user-favorites', icon: '❤️', label: 'علاقه‌مندی‌ها', desc: 'محصولات مورد علاقه' },
]
</script>

<style scoped>
.input-field {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}
.input-field:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(var(--color-brand-rgb, 59 130 246), 0.1);
}
.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.dir-ltr { direction: ltr; }
</style>
