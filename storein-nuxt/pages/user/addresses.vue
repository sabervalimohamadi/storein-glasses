<template>
  <div class="container-main py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-text-primary">
        آدرس‌های من
        <span class="text-text-secondary font-normal text-sm font-fanum mr-2">
          ({{ addresses.length }} از ۱۰)
        </span>
      </h1>
      <button
        v-if="addresses.length < 10"
        @click="openAdd"
        class="btn-brand text-sm px-4 py-2 flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
        </svg>
        افزودن آدرس
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 3" :key="i" class="h-44 rounded-2xl skeleton" />
    </div>

    <!-- Empty -->
    <BaseEmpty
      v-else-if="!addresses.length"
      icon="🏠"
      title="آدرسی ثبت نشده"
      subtitle="آدرس تحویل سفارش‌هایتان را اینجا ذخیره کنید"
      action="افزودن آدرس"
      @action="openAdd"
    />

    <!-- Address cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="addr in addresses" :key="addr._id"
        :class="[
          'rounded-2xl border p-5 flex flex-col gap-3 transition-all relative',
          addr.isDefault ? 'border-brand' : 'border-surface-border',
        ]"
        style="background-color: var(--color-card)"
      >
        <!-- Default badge -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-text-primary">{{ addr.title }}</span>
            <span
              v-if="addr.isDefault"
              class="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full font-medium"
            >
              پیش‌فرض
            </span>
          </div>
          <!-- Actions menu -->
          <div class="flex items-center gap-1">
            <button
              v-if="!addr.isDefault"
              @click="setDefault(addr)"
              :disabled="settingDefaultId === addr._id"
              class="text-xs text-brand hover:underline disabled:opacity-50 transition-opacity px-2 py-1"
            >
              {{ settingDefaultId === addr._id ? '...' : 'پیش‌فرض' }}
            </button>
            <button
              @click="openEdit(addr)"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-brand hover:bg-brand/5 transition-colors"
              title="ویرایش"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              @click="openDelete(addr)"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-error hover:bg-error/5 transition-colors"
              title="حذف"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Address info -->
        <div class="text-sm text-text-secondary leading-7 border-t border-surface-border pt-3">
          <p class="text-text-primary font-medium">{{ addr.recipientName }}</p>
          <p class="font-fanum dir-ltr inline-block">{{ addr.recipientPhone }}</p>
          <p class="mt-1">
            {{ addr.province }}، {{ addr.city }}، {{ addr.street }}
          </p>
          <p>{{ addr.detail }}</p>
          <p class="text-xs font-fanum mt-1 text-text-disabled">کد پستی: {{ addr.postalCode }}</p>
        </div>
      </div>
    </div>

    <!-- ── Add / Edit Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style="background: rgba(0,0,0,0.55)"
          @click.self="closeModal"
        >
          <div
            class="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-surface-border flex flex-col max-h-[calc(90dvh-3.5rem)] sm:max-h-[85vh] mb-14 sm:mb-0"
            style="background-color: var(--color-card)"
          >
            <!-- Modal header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
              <h2 class="font-bold text-text-primary">
                {{ editTarget ? 'ویرایش آدرس' : 'افزودن آدرس جدید' }}
              </h2>
              <button @click="closeModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Modal body (scrollable) -->
            <form @submit.prevent="handleSave" class="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

              <!-- Title -->
              <div class="flex flex-col gap-1.5">
                <label class="form-label">عنوان آدرس <span class="text-error">*</span></label>
                <div class="flex gap-2">
                  <button
                    v-for="preset in titlePresets" :key="preset"
                    type="button"
                    @click="form.title = preset"
                    :class="[
                      'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                      form.title === preset
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-surface-border text-text-secondary hover:border-brand/40',
                    ]"
                  >
                    {{ preset }}
                  </button>
                </div>
                <input v-model="form.title" type="text" class="form-input" placeholder="مثلاً: خانه، محل کار" maxlength="30" required />
                <p v-if="errors.title" class="text-error text-xs">{{ errors.title }}</p>
              </div>

              <!-- Recipient -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="form-label">نام گیرنده <span class="text-error">*</span></label>
                  <input v-model="form.recipientName" type="text" class="form-input" placeholder="نام و نام خانوادگی" maxlength="60" required />
                  <p v-if="errors.recipientName" class="text-error text-xs">{{ errors.recipientName }}</p>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="form-label">تلفن گیرنده <span class="text-error">*</span></label>
                  <input v-model="form.recipientPhone" type="tel" class="form-input font-fanum" placeholder="09xxxxxxxxx" dir="ltr" maxlength="11" required />
                  <p v-if="errors.recipientPhone" class="text-error text-xs">{{ errors.recipientPhone }}</p>
                </div>
              </div>

              <!-- Province + City dropdowns -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="form-label">استان <span class="text-error">*</span></label>
                  <div class="select-wrapper">
                    <select
                      v-model="form.province"
                      class="form-input form-select"
                      required
                      @change="onProvinceChange"
                    >
                      <option value="" disabled>انتخاب استان</option>
                      <option v-for="p in PROVINCE_NAMES" :key="p" :value="p">{{ p }}</option>
                    </select>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="form-label">شهر <span class="text-error">*</span></label>
                  <div class="select-wrapper">
                    <select
                      v-model="form.city"
                      class="form-input form-select"
                      required
                      :disabled="!form.province"
                    >
                      <option value="" disabled>{{ form.province ? 'انتخاب شهر' : 'اول استان را انتخاب کنید' }}</option>
                      <option v-for="c in availableCities" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Street -->
              <div class="flex flex-col gap-1.5">
                <label class="form-label">خیابان / بلوار / کوچه <span class="text-error">*</span></label>
                <input v-model="form.street" type="text" class="form-input" placeholder="خیابان ولیعصر، کوچه بهار" maxlength="100" required />
              </div>

              <!-- Detail -->
              <div class="flex flex-col gap-1.5">
                <label class="form-label">جزئیات آدرس <span class="text-error">*</span></label>
                <textarea v-model="form.detail" class="form-input resize-none" rows="2" placeholder="پلاک، طبقه، واحد..." maxlength="200" required />
              </div>

              <!-- Postal code -->
              <div class="flex flex-col gap-1.5">
                <label class="form-label">کد پستی <span class="text-error">*</span></label>
                <input v-model="form.postalCode" type="text" class="form-input font-fanum" placeholder="1234567890" dir="ltr" maxlength="10" required />
                <p v-if="errors.postalCode" class="text-error text-xs">{{ errors.postalCode }}</p>
              </div>

              <!-- Default toggle -->
              <label class="flex items-center gap-3 cursor-pointer select-none py-1">
                <div
                  @click="form.isDefault = !form.isDefault"
                  :class="[
                    'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                    form.isDefault ? 'bg-brand' : 'bg-surface-border',
                  ]"
                >
                  <span
                    :class="[
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                      form.isDefault ? 'right-0.5' : 'left-0.5',
                    ]"
                  />
                </div>
                <span class="text-sm text-text-primary">تنظیم به عنوان آدرس پیش‌فرض</span>
              </label>

            </form>

            <!-- Modal footer -->
            <div class="px-6 py-4 border-t border-surface-border flex gap-3 flex-shrink-0">
              <button
                type="button"
                @click="handleSave"
                :disabled="saving"
                class="flex-1 btn-brand py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {{ saving ? 'در حال ذخیره...' : (editTarget ? 'ذخیره تغییرات' : 'افزودن آدرس') }}
              </button>
              <button type="button" @click="closeModal" class="px-4 py-3 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors">
                انصراف
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete confirm ── -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.5)"
        @click.self="deleteTarget = null"
      >
        <div
          class="w-full max-w-sm rounded-2xl border border-surface-border p-6 flex flex-col gap-4"
          style="background-color: var(--color-card)"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-error" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-text-primary">حذف آدرس</p>
              <p class="text-sm text-text-secondary mt-0.5">«{{ deleteTarget?.title }}»</p>
            </div>
          </div>
          <p class="text-sm text-text-secondary leading-6">آیا از حذف این آدرس مطمئن هستید؟ این عملیات قابل برگشت نیست.</p>
          <div class="flex gap-3">
            <button
              @click="confirmDelete"
              :disabled="deleting"
              class="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {{ deleting ? 'در حال حذف...' : 'حذف شود' }}
            </button>
            <button
              @click="deleteTarget = null"
              class="flex-1 py-2.5 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>

definePageMeta({ layout: 'default', middleware: ['auth'] })


import { ref, computed, onMounted } from 'vue'
import { userService }     from '~/services/user.service'
import { useAuthStore }    from '~/stores/auth.store'
import { useUiStore }      from '~/stores/ui.store'
import BaseEmpty           from '~/components/common/BaseEmpty.vue'
import { PROVINCE_NAMES, getCities } from '~/data/iran-cities'

const authStore = useAuthStore()
const ui        = useUiStore()

const addresses      = ref([])
const loading        = ref(true)
const showModal      = ref(false)
const editTarget     = ref(null)
const deleteTarget   = ref(null)
const settingDefaultId = ref(null)
const saving         = ref(false)
const deleting       = ref(false)

const titlePresets = ['خانه', 'محل کار', 'خانه پدری']

const emptyForm = () => ({
  title: '', province: '', city: '', street: '',
  detail: '', postalCode: '', recipientName: '', recipientPhone: '',
  isDefault: false,
})

const form   = ref(emptyForm())
const errors = ref({})

const availableCities = computed(() => getCities(form.value.province))

function onProvinceChange() {
  form.value.city = ''
}

// ── Fetch ──────────────────────────────────────────────────────
async function fetchAddresses() {
  loading.value = true
  try {
    const { data } = await userService.getProfile()
    addresses.value = data.addresses ?? []
    authStore.user  = data
  } catch {
    ui.addToast('خطا در دریافت آدرس‌ها', 'error')
  } finally {
    loading.value = false
  }
}

// ── Modal ──────────────────────────────────────────────────────
function openAdd() {
  editTarget.value = null
  form.value       = emptyForm()
  errors.value     = {}
  showModal.value  = true
}

function openEdit(addr) {
  editTarget.value = addr
  form.value = {
    title:          addr.title,
    province:       addr.province,
    city:           addr.city,
    street:         addr.street,
    detail:         addr.detail,
    postalCode:     addr.postalCode,
    recipientName:  addr.recipientName,
    recipientPhone: addr.recipientPhone,
    isDefault:      addr.isDefault,
  }
  errors.value    = {}
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editTarget.value = null
}

// ── Validate ───────────────────────────────────────────────────
function validate() {
  const e = {}
  if (!form.value.title.trim())          e.title = 'عنوان الزامی است'
  if (!form.value.recipientName.trim())  e.recipientName = 'نام گیرنده الزامی است'
  if (!/^(\+98|0)?9\d{9}$/.test(form.value.recipientPhone))
    e.recipientPhone = 'شماره تلفن معتبر نیست (مثال: 09123456789)'
  if (!/^\d{10}$/.test(form.value.postalCode))
    e.postalCode = 'کد پستی باید دقیقاً ۱۰ رقم باشد'
  errors.value = e
  return !Object.keys(e).length
}

// ── Save ───────────────────────────────────────────────────────
async function handleSave() {
  if (!validate()) return
  saving.value = true
  try {
    let data
    if (editTarget.value) {
      ;({ data } = await userService.updateAddress(editTarget.value._id, form.value))
    } else {
      ;({ data } = await userService.addAddress(form.value))
    }
    addresses.value = data.addresses ?? []
    authStore.user  = data
    closeModal()
    ui.addToast(editTarget.value ? 'آدرس ویرایش شد' : 'آدرس افزوده شد', 'success')
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg || 'خطا در ذخیره آدرس'), 'error')
  } finally {
    saving.value = false
  }
}

// ── Delete ─────────────────────────────────────────────────────
function openDelete(addr) {
  deleteTarget.value = addr
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const { data } = await userService.deleteAddress(deleteTarget.value._id)
    addresses.value    = data.addresses ?? []
    authStore.user     = data
    deleteTarget.value = null
    ui.addToast('آدرس حذف شد', 'success')
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(msg || 'خطا در حذف آدرس', 'error')
  } finally {
    deleting.value = false
  }
}

// ── Set default ─────────────────────────────────────────────────
async function setDefault(addr) {
  settingDefaultId.value = addr._id
  try {
    const { data } = await userService.setDefault(addr._id)
    addresses.value    = data.addresses ?? []
    authStore.user     = data
    ui.addToast('آدرس پیش‌فرض تغییر کرد', 'success')
  } catch {
    ui.addToast('خطا در تنظیم آدرس پیش‌فرض', 'error')
  } finally {
    settingDefaultId.value = null
  }
}

onMounted(fetchAddresses)
</script>

<style scoped>
.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
}
.form-input {
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
.form-input:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand) 12%, transparent);
}
.dir-ltr { direction: ltr; }

.select-wrapper {
  position: relative;
}
.select-wrapper::after {
  content: '';
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid var(--color-text-secondary);
  pointer-events: none;
}
.form-select {
  appearance: none;
  -webkit-appearance: none;
  padding-left: 2rem;
  cursor: pointer;
}
.form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .w-full,
.modal-leave-active .w-full { transition: transform 0.25s ease; }
.modal-enter-from .w-full { transform: translateY(40px); }
.modal-leave-to .w-full { transform: translateY(40px); }
</style>
