<template>
  <div class="discount-form-page px-4 py-6 max-w-3xl mx-auto">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/discounts"
        class="back-btn w-9 h-9 rounded-xl flex items-center justify-center border border-border text-text-secondary hover:text-text-primary transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
        </svg>
      </RouterLink>
      <div>
        <h1 class="text-xl font-bold text-text-primary">{{ isEdit ? 'ویرایش تخفیف' : 'تخفیف جدید' }}</h1>
        <p class="text-xs text-text-disabled mt-0.5">{{ isEdit ? `ویرایش: ${form.title}` : 'ایجاد تخفیف زمان‌دار یا عمده‌فروشی' }}</p>
      </div>
    </div>

    <div v-if="loadingForm" class="flex justify-center py-20">
      <svg class="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <form v-else @submit.prevent="submit" class="space-y-5">

      <!-- 1. نوع تخفیف -->
      <div class="form-card">
        <p class="field-label mb-3">نوع تخفیف <span class="text-danger">*</span></p>
        <div class="flex gap-3">
          <label class="kind-radio" :class="{ 'kind-radio--on': form.kind === 'time_limited' }">
            <input type="radio" v-model="form.kind" value="time_limited" class="sr-only"/>
            <span class="kind-radio__icon">🔴</span>
            <div>
              <span class="kind-radio__title">تخفیف زمان‌دار</span>
              <span class="kind-radio__sub">فلش سیل، فصلی، رویداد</span>
            </div>
          </label>
          <label class="kind-radio" :class="{ 'kind-radio--on': form.kind === 'wholesale' }">
            <input type="radio" v-model="form.kind" value="wholesale" class="sr-only"/>
            <span class="kind-radio__icon">🔵</span>
            <div>
              <span class="kind-radio__title">ویژه عمده‌فروشی</span>
              <span class="kind-radio__sub">قیمت خاص برای مشتریان عمده</span>
            </div>
          </label>
        </div>
        <p v-if="errors.kind" class="err-msg">{{ errors.kind }}</p>
      </div>

      <!-- 2. عنوان -->
      <div class="form-card">
        <label class="field-label">عنوان تخفیف <span class="text-danger">*</span></label>
        <input v-model="form.title" type="text" dir="rtl" placeholder="مثال: جشنواره عید"
          class="field-input mt-1.5" :class="{ 'field-input--err': errors.title }"/>
        <p v-if="errors.title" class="err-msg">{{ errors.title }}</p>
      </div>

      <!-- 3. توضیحات -->
      <div class="form-card">
        <label class="field-label">توضیحات (اختیاری)</label>
        <textarea v-model="form.description" dir="rtl" rows="2" placeholder="توضیح کوتاه..."
          class="field-input mt-1.5 resize-none"/>
      </div>

      <!-- 4 & 5. نوع مقدار + مقدار -->
      <div class="form-card">
        <p class="field-label mb-3">نوع و مقدار تخفیف <span class="text-danger">*</span></p>
        <div class="flex gap-3 mb-3">
          <label class="type-radio" :class="{ 'type-radio--on': form.discountType === 'percentage' }">
            <input type="radio" v-model="form.discountType" value="percentage" class="sr-only"/>
            درصدی ٪
          </label>
          <label class="type-radio" :class="{ 'type-radio--on': form.discountType === 'fixed' }">
            <input type="radio" v-model="form.discountType" value="fixed" class="sr-only"/>
            مبلغ ثابت (تومان)
          </label>
        </div>
        <div class="relative">
          <input v-model.number="form.value" type="number" min="0"
            :max="form.discountType === 'percentage' ? 100 : undefined"
            :placeholder="form.discountType === 'percentage' ? 'مثال: 20' : 'مثال: 50000'"
            class="field-input" :class="{ 'field-input--err': errors.value }"
            dir="ltr" style="padding-left:3.5rem"/>
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-disabled font-fanum">
            {{ form.discountType === 'percentage' ? '٪' : 'تومان' }}
          </span>
        </div>
        <p v-if="errors.value" class="err-msg">{{ errors.value }}</p>
      </div>

      <!-- 6. سقف تخفیف -->
      <div v-if="form.discountType === 'percentage'" class="form-card">
        <label class="field-label">سقف تخفیف (تومان) — اختیاری</label>
        <input v-model.number="form.maxDiscountAmount" type="number" min="0"
          placeholder="مثال: 200000" class="field-input mt-1.5" dir="ltr"/>
        <p class="text-xs text-text-disabled mt-1">اگر خالی باشد بدون سقف اعمال می‌شود</p>
      </div>

      <!-- 7 & 8. بازه زمانی (only time_limited) -->
      <div v-if="form.kind === 'time_limited'" class="form-card">
        <p class="field-label mb-3">بازه زمانی <span class="text-xs font-normal text-text-disabled">(اختیاری)</span></p>
        <div class="grid grid-cols-2 gap-4">
          <PersianDatePicker
            v-model="form.startDate"
            label="تاریخ شروع"
            :required="false"
            :error="errors.startDate"
            placeholder="انتخاب تاریخ شروع"
          />
          <PersianDatePicker
            v-model="form.endDate"
            label="تاریخ پایان"
            :required="false"
            :min-date="form.startDate || ''"
            :error="errors.endDate"
            placeholder="انتخاب تاریخ پایان"
          />
        </div>
        <p v-if="dateRangeError" class="err-msg mt-2">{{ dateRangeError }}</p>
        <p class="text-xs text-text-disabled mt-2">اگر تاریخ وارد نشود، تخفیف بدون محدودیت زمانی اعمال می‌شود</p>
      </div>

      <!-- 9 & 10. عمده‌فروشی (only wholesale) -->
      <div v-if="form.kind === 'wholesale'" class="form-card">
        <p class="field-label mb-3">تنظیمات عمده‌فروشی</p>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">حداقل تعداد سفارش</label>
            <input v-model.number="form.minQuantity" type="number" min="1"
              placeholder="مثال: 10" class="field-input mt-1.5" dir="ltr"/>
          </div>
          <div>
            <label class="field-label">گروه مشتری</label>
            <select v-model="form.customerGroup" class="field-input mt-1.5">
              <option value="">هر دو گروه</option>
              <option value="wholesale">عمده‌فروش</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 11. هدف تخفیف -->
      <div class="form-card">
        <p class="field-label mb-3">هدف تخفیف <span class="text-danger">*</span></p>

        <div class="flex gap-3 mb-4">
          <label v-for="opt in targetOpts" :key="opt.value"
            class="type-radio" :class="{ 'type-radio--on': form.targetType === opt.value }">
            <input type="radio" v-model="form.targetType" :value="opt.value" class="sr-only"/>
            {{ opt.label }}
          </label>
        </div>
        <p v-if="errors.targetType" class="err-msg">{{ errors.targetType }}</p>

        <!-- Products multi-select -->
        <div v-if="form.targetType === 'products'">
          <div class="flex gap-2 mb-2">
            <input v-model="productSearch" type="text" dir="rtl" placeholder="جستجوی محصول..."
              class="field-input flex-1 h-9 text-sm" @input="searchProducts"/>
            <svg v-if="searchingProducts" class="w-4 h-4 animate-spin text-primary self-center" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>

          <div v-if="productResults.length" class="border border-border rounded-lg mb-3 max-h-40 overflow-y-auto">
            <div v-for="p in productResults" :key="p._id"
              class="flex items-center gap-2 px-3 py-2 hover:bg-surface cursor-pointer text-sm"
              @click="addProduct(p)">
              <img :src="p.thumbnail || p.images?.[0]" class="w-7 h-7 rounded object-contain border border-border"
                @error="e => e.target.style.opacity='0'" />
              <span class="truncate">{{ p.name }}</span>
              <svg v-if="selectedProductIds.has(p._id)" class="w-4 h-4 text-success ml-auto flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <span v-for="p in selectedProducts" :key="p._id"
              class="selected-tag">
              {{ p.name }}
              <button type="button" @click="removeProduct(p._id)" class="mr-1 text-text-disabled hover:text-danger">×</button>
            </span>
            <span v-if="!selectedProducts.length" class="text-xs text-text-disabled">هنوز محصولی انتخاب نشده</span>
          </div>
        </div>

        <!-- Categories multi-select -->
        <div v-if="form.targetType === 'categories'">
          <div v-if="loadingCategories" class="text-xs text-text-disabled">در حال بارگذاری دسته‌بندی‌ها...</div>
          <div v-else class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
            <label v-for="cat in categories" :key="cat._id"
              class="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
              <input type="checkbox" :value="cat._id" v-model="form.targetIds"
                class="rounded" />
              {{ cat.name }}
            </label>
          </div>
          <p v-if="!loadingCategories && !categories.length" class="text-xs text-text-disabled mt-2">دسته‌بندی‌ای یافت نشد</p>
        </div>

        <!-- Brands multi-select -->
        <div v-if="form.targetType === 'brands'">
          <div v-if="loadingBrands" class="text-xs text-text-disabled">در حال بارگذاری برندها...</div>
          <div v-else class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
            <label v-for="brand in brands" :key="brand._id"
              class="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
              <input type="checkbox" :value="brand._id" v-model="form.targetIds"
                class="rounded" />
              <img v-if="brand.logo" :src="brand.logo"
                class="w-5 h-5 object-contain rounded border border-border flex-shrink-0"
                @error="e => e.target.style.display='none'" />
              {{ brand.name }}
            </label>
          </div>
          <p v-if="!loadingBrands && !brands.length" class="text-xs text-text-disabled mt-2">برندی یافت نشد</p>
        </div>
      </div>

      <!-- 12. شرایط اختیاری -->
      <div class="form-card">
        <p class="field-label mb-3">شرایط (اختیاری)</p>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">حداقل مبلغ سفارش (تومان)</label>
            <input v-model.number="form.minOrderAmount" type="number" min="0"
              placeholder="مثال: 500000" class="field-input mt-1.5" dir="ltr"/>
          </div>
          <div>
            <label class="field-label">حداکثر تعداد استفاده</label>
            <input v-model.number="form.maxUsageCount" type="number" min="1"
              placeholder="خالی = نامحدود" class="field-input mt-1.5" dir="ltr"/>
          </div>
        </div>
      </div>

      <!-- 14. اولویت -->
      <div class="form-card">
        <label class="field-label">اولویت (عدد بالاتر = اجرا اول)</label>
        <input v-model.number="form.priority" type="number" min="0"
          placeholder="0" class="field-input mt-1.5 w-32" dir="ltr"/>
      </div>

      <!-- Submit -->
      <div class="flex gap-3">
        <button type="submit" :disabled="saving"
          class="submit-btn flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
          <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          {{ saving ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'ایجاد تخفیف' }}
        </button>
        <RouterLink to="/discounts"
          class="cancel-btn h-11 px-6 rounded-xl border border-border text-text-secondary text-sm flex items-center justify-center hover:bg-surface transition-all">
          انصراف
        </RouterLink>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { discountService } from '@/services/discount.service'
import { productService  } from '@/services/product.service'
import { categoryService } from '@/services/category.service.js'
import { brandService    } from '@/services/brand.service.js'
import { useUiStore } from '@/stores/ui.store'
import PersianDatePicker from '@/components/ui/PersianDatePicker.vue'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const isEdit      = computed(() => !!route.params.id)
const loadingForm = ref(false)
const saving      = ref(false)

const form = reactive({
  kind:             'time_limited',
  title:            '',
  description:      '',
  discountType:     'percentage',
  value:            0,
  maxDiscountAmount: null,
  startDate:        null,
  endDate:          null,
  targetType:       'all',
  targetIds:        [],
  minOrderAmount:   null,
  minQuantity:      null,
  customerGroup:    '',
  maxUsageCount:    null,
  priority:         0,
})

const errors = reactive({
  kind: '', title: '', value: '', startDate: '', endDate: '', targetType: '',
})

const dateRangeError = computed(() => {
  if (form.kind !== 'time_limited') return ''
  if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate))
    return 'تاریخ پایان باید بعد از تاریخ شروع باشد'
  return ''
})

// Products
const productSearch     = ref('')
const productResults    = ref([])
const searchingProducts = ref(false)
const selectedProducts  = ref([])
const selectedProductIds = computed(() => new Set(selectedProducts.value.map(p => p._id)))

let searchTimer = null
function searchProducts() {
  clearTimeout(searchTimer)
  if (!productSearch.value.trim()) { productResults.value = []; return }
  searchTimer = setTimeout(async () => {
    searchingProducts.value = true
    try {
      const { data } = await productService.getAll({ search: productSearch.value, limit: 20 })
      productResults.value = data?.products ?? []
    } finally { searchingProducts.value = false }
  }, 350)
}

function addProduct(p) {
  if (!selectedProductIds.value.has(p._id)) selectedProducts.value.push(p)
  form.targetIds = selectedProducts.value.map(x => x._id)
}

function removeProduct(id) {
  selectedProducts.value = selectedProducts.value.filter(p => p._id !== id)
  form.targetIds = selectedProducts.value.map(x => x._id)
}

// Categories
const categories        = ref([])
const loadingCategories = ref(false)

async function loadCategories() {
  loadingCategories.value = true
  try {
    const { data } = await categoryService.getAll({ limit: 200 })
    categories.value = data?.categories ?? data ?? []
  } finally { loadingCategories.value = false }
}

// Brands
const brands        = ref([])
const loadingBrands = ref(false)

async function loadBrands() {
  loadingBrands.value = true
  try {
    const { data } = await brandService.getAll()
    brands.value = data?.brands ?? data ?? []
  } finally { loadingBrands.value = false }
}

const targetOpts = [
  { value: 'all',        label: 'همه محصولات' },
  { value: 'products',   label: 'محصولات خاص' },
  { value: 'categories', label: 'دسته‌بندی' },
  { value: 'brands',     label: 'برند' },
]

watch(() => form.targetType, () => {
  form.targetIds = []
  selectedProducts.value = []
  productResults.value   = []
  productSearch.value    = ''
})

function validate() {
  let ok = true
  Object.keys(errors).forEach(k => errors[k] = '')
  if (!form.kind)  { errors.kind = 'نوع تخفیف الزامی است'; ok = false }
  if (!form.title.trim()) { errors.title = 'عنوان الزامی است'; ok = false }
  if (form.value == null || form.value < 0) { errors.value = 'مقدار الزامی است'; ok = false }
  if (form.kind === 'time_limited' && dateRangeError.value) {
    errors.endDate = dateRangeError.value; ok = false
  }
  return ok
}

function buildPayload() {
  return {
    title:        form.title.trim(),
    description:  form.description.trim() || undefined,
    discountType: form.discountType,
    value:        Number(form.value),
    maxDiscountAmount: form.maxDiscountAmount || undefined,
    startDate:    form.kind === 'time_limited' ? form.startDate : undefined,
    endDate:      form.kind === 'time_limited' ? form.endDate   : undefined,
    targetType:   form.targetType,
    targetIds:    form.targetIds.length ? form.targetIds : undefined,
    minOrderAmount: form.minOrderAmount || undefined,
    minQuantity:    form.kind === 'wholesale' ? (form.minQuantity || undefined) : undefined,
    customerGroup:  form.kind === 'wholesale' && form.customerGroup ? form.customerGroup : undefined,
    maxUsageCount:  form.maxUsageCount || undefined,
    priority:       form.priority ?? 0,
  }
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await discountService.update(route.params.id, payload)
      ui.addToast('تخفیف با موفقیت ویرایش شد', 'success')
    } else {
      await discountService.create(payload)
      ui.addToast('تخفیف با موفقیت ایجاد شد', 'success')
    }
    router.push('/discounts')
  } catch (err) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) ui.addToast(msg.join(' | '), 'error')
    else ui.addToast(msg ?? 'خطا در ذخیره تخفیف', 'error')
  } finally {
    saving.value = false
  }
}

async function loadEdit() {
  if (!isEdit.value) return
  loadingForm.value = true
  try {
    const { data } = await discountService.getById(route.params.id)
    Object.assign(form, {
      kind:             data.kind,
      title:            data.title,
      description:      data.description ?? '',
      discountType:     data.discountType,
      value:            data.value,
      maxDiscountAmount: data.maxDiscountAmount ?? null,
      startDate:        data.startDate ?? null,
      endDate:          data.endDate   ?? null,
      targetType:       data.targetType,
      targetIds:        (data.targetIds ?? []).map(id => id.toString?.() ?? id),
      minOrderAmount:   data.minOrderAmount ?? null,
      minQuantity:      data.minQuantity    ?? null,
      customerGroup:    data.customerGroup  ?? '',
      maxUsageCount:    data.maxUsageCount  ?? null,
      priority:         data.priority ?? 0,
    })
  } catch {
    ui.addToast('خطا در بارگذاری تخفیف', 'error')
    router.push('/discounts')
  } finally {
    loadingForm.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadEdit(), loadCategories(), loadBrands()])
})
</script>

<style scoped>
.form-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.25rem;
}

.field-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.field-input {
  width: 100%;
  height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
  direction: rtl;
}
.field-input:focus { border-color: rgba(27,79,138,0.5); box-shadow: 0 0 0 3px rgba(27,79,138,0.1); }
.field-input--err  { border-color: #ef4444; }
textarea.field-input { height: auto; padding: 0.5rem 0.75rem; }
select.field-input { cursor: pointer; }

.kind-radio {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--color-border);
  cursor: pointer;
  transition: all 0.15s;
}
.kind-radio--on {
  border-color: rgba(27,79,138,0.5);
  background: rgba(27,79,138,0.06);
}
.kind-radio__icon { font-size: 1.5rem; flex-shrink: 0; }
.kind-radio__title { display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-primary); }
.kind-radio__sub   { display: block; font-size: 0.7rem;  color: var(--color-text-disabled); margin-top: 2px; }

.type-radio {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--color-border);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: all 0.15s;
}
.type-radio--on {
  border-color: rgba(27,79,138,0.5);
  background: rgba(27,79,138,0.08);
  color: #3B6FBE;
}

.err-msg { font-size: 0.75rem; color: #ef4444; margin-top: 0.25rem; }
.text-danger { color: #ef4444; }

.selected-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(27,79,138,0.1);
  color: #3B6FBE;
  border: 1px solid rgba(27,79,138,0.2);
}

.submit-btn {
  background: linear-gradient(135deg, #1B4F8A, #3B6FBE);
  color: white;
  box-shadow: 0 4px 14px rgba(27,79,138,0.4);
  transition: all 0.15s;
}
.submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
