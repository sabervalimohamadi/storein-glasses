<template>
  <div class="page-wrapper">
    <!-- ── Header ── -->
    <div class="page-header">
      <div class="header-left">
        <router-link to="/time-discounts" class="back-btn" title="بازگشت">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </router-link>
        <div>
          <h1 class="page-title">{{ isEdit ? 'ویرایش تخفیف' : 'تخفیف جدید' }}</h1>
          <p class="page-subtitle">{{ isEdit ? 'ویرایش اطلاعات تخفیف مدت‌دار' : 'ایجاد تخفیف مدت‌دار روی محصولات فروشگاه' }}</p>
        </div>
      </div>
    </div>

    <form @submit.prevent="submit" class="form-layout">

      <!-- ── LEFT: main form ── -->
      <div class="form-main">

        <!-- Section 1: Basic info -->
        <div class="form-section">
          <div class="section-head">
            <span class="section-icon">📝</span>
            <span class="section-label">اطلاعات پایه</span>
          </div>

          <div class="form-group">
            <label class="field-label">عنوان تخفیف <span class="req">*</span></label>
            <AdminInput v-model="form.title" placeholder="مثال: جشنواره عید نوروز" :error="errors.title" />
          </div>
        </div>

        <!-- Section 2: Value -->
        <div class="form-section">
          <div class="section-head">
            <span class="section-icon">💰</span>
            <span class="section-label">مقدار تخفیف</span>
          </div>

          <!-- Type toggle -->
          <div class="form-group">
            <label class="field-label">نوع تخفیف <span class="req">*</span></label>
            <div class="type-toggle">
              <button
                type="button"
                :class="['toggle-btn', form.discountType === 'percentage' ? 'toggle-active' : '']"
                @click="form.discountType = 'percentage'"
              >
                <span class="toggle-symbol">٪</span>
                درصدی
              </button>
              <button
                type="button"
                :class="['toggle-btn', form.discountType === 'fixed' ? 'toggle-active' : '']"
                @click="form.discountType = 'fixed'"
              >
                <span class="toggle-symbol">₮</span>
                مبلغ ثابت
              </button>
            </div>
          </div>

          <!-- Value -->
          <div class="form-group">
            <label class="field-label">
              {{ form.discountType === 'percentage' ? 'درصد تخفیف' : 'مبلغ تخفیف (تومان)' }}
              <span class="req">*</span>
            </label>
            <div class="value-wrap">
              <span :class="['val-badge', form.discountType === 'percentage' ? 'val-pct' : 'val-fix']">
                {{ form.discountType === 'percentage' ? '٪' : 'تومان' }}
              </span>
              <AdminInput
                v-model.number="form.value"
                type="number"
                :min="0"
                :max="form.discountType === 'percentage' ? 100 : undefined"
                :placeholder="form.discountType === 'percentage' ? 'مثال: ۲۰' : 'مثال: ۵۰۰۰۰'"
                :error="errors.value"
                class="val-input"
              />
            </div>
            <p v-if="valueHint" class="field-hint hint-green">{{ valueHint }}</p>
          </div>

          <!-- Max cap -->
          <div v-if="form.discountType === 'percentage'" class="form-group optional-group">
            <label class="field-label">
              سقف تخفیف
              <span class="badge-opt">اختیاری</span>
            </label>
            <div class="value-wrap">
              <span class="val-badge val-fix">تومان</span>
              <AdminInput
                v-model.number="form.maxDiscountAmount"
                type="number"
                :min="0"
                placeholder="بدون سقف"
                class="val-input"
              />
            </div>
            <p class="field-hint">حداکثر تخفیف قابل اعمال — وقتی تخفیف از این عدد بیشتر شود، همین مقدار ثابت اعمال می‌شود</p>
          </div>
        </div>

        <!-- Section 3: Date range -->
        <div class="form-section">
          <div class="section-head">
            <span class="section-icon">📅</span>
            <span class="section-label">بازه زمانی</span>
          </div>

          <div class="date-range">
            <div class="date-group">
              <label class="field-label">تاریخ شروع <span class="req">*</span></label>
              <date-picker
                v-model="form.startDate"
                type="datetime"
                format="YYYY-MM-DDTHH:mm:ss"
                display-format="jYYYY/jMM/jDD HH:mm"
                :clearable="false"
                input-class="date-input"
              />
              <p v-if="errors.startDate" class="field-error">{{ errors.startDate }}</p>
            </div>

            <div class="date-sep">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </div>

            <div class="date-group">
              <label class="field-label">تاریخ پایان <span class="req">*</span></label>
              <date-picker
                v-model="form.endDate"
                type="datetime"
                format="YYYY-MM-DDTHH:mm:ss"
                display-format="jYYYY/jMM/jDD HH:mm"
                :clearable="false"
                input-class="date-input"
              />
              <p v-if="errors.endDate" class="field-error">{{ errors.endDate }}</p>
            </div>
          </div>

          <div v-if="dateRangeText" class="duration-bar">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {{ dateRangeText }}
            <template v-if="durationText">
              <span class="dur-sep">|</span>
              <span class="dur-days">{{ durationText }}</span>
            </template>
          </div>
        </div>

        <!-- Section 4: Target -->
        <div class="form-section">
          <div class="section-head">
            <span class="section-icon">🎯</span>
            <span class="section-label">هدف تخفیف</span>
          </div>

          <div class="form-group">
            <label class="field-label">شمول تخفیف <span class="req">*</span></label>
            <div class="target-grid">
              <button
                v-for="opt in targetOptions"
                :key="opt.value"
                type="button"
                :class="['target-btn', form.targetType === opt.value ? 'target-active' : '']"
                @click="form.targetType = opt.value; form.targetIds = []"
              >
                <span class="target-icon">{{ opt.icon }}</span>
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Products -->
          <div v-if="form.targetType === 'products'" class="form-group">
            <label class="field-label">محصولات مشمول</label>
            <div class="multiselect-wrap">
              <div class="search-wrap">
                <svg class="s-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path stroke-linecap="round" d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  v-model="productSearch"
                  class="search-input"
                  placeholder="جستجوی نام محصول..."
                  @input="searchProducts"
                />
              </div>
              <div v-if="productResults.length" class="dropdown-list">
                <div
                  v-for="p in productResults"
                  :key="p._id"
                  class="dropdown-item"
                  @click="selectProduct(p)"
                >{{ p.name }}</div>
              </div>
              <div v-if="selectedProducts.length" class="selected-tags">
                <span v-for="p in selectedProducts" :key="p._id" class="stag">
                  {{ p.name }}
                  <button type="button" @click="removeProduct(p._id)" aria-label="حذف">×</button>
                </span>
              </div>
              <p v-if="!selectedProducts.length" class="field-hint">جستجو کنید و محصولات را انتخاب کنید</p>
            </div>
          </div>

          <!-- Categories -->
          <div v-if="form.targetType === 'categories'" class="form-group">
            <label class="field-label">دسته‌بندی‌های مشمول</label>
            <div class="cat-list">
              <label v-for="c in allCategories" :key="c._id" class="cat-item">
                <input type="checkbox" :value="c._id" v-model="form.targetIds" class="cat-checkbox" />
                <span>{{ c.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Section 5: Limits -->
        <div class="form-section">
          <div class="section-head">
            <span class="section-icon">⚙️</span>
            <span class="section-label">محدودیت‌ها</span>
            <span class="badge-opt">همه اختیاری</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="field-label">حداقل مبلغ سفارش</label>
              <div class="value-wrap">
                <span class="val-badge val-fix">تومان</span>
                <AdminInput
                  v-model.number="form.minOrderAmount"
                  type="number"
                  :min="0"
                  placeholder="بدون محدودیت"
                  class="val-input"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="field-label">حداکثر تعداد استفاده</label>
              <AdminInput v-model.number="form.maxUsageCount" type="number" :min="1" placeholder="نامحدود" />
            </div>
          </div>
        </div>

      </div><!-- /form-main -->

      <!-- ── RIGHT: sidebar ── -->
      <div class="form-side">

        <!-- Preview card -->
        <div v-if="form.value > 0 || form.title" class="preview-card">
          <div class="preview-label-top">پیش‌نمایش تخفیف</div>
          <div class="preview-badge-wrap">
            <div class="preview-badge">
              <span class="preview-val">{{ form.value || '—' }}{{ form.discountType === 'percentage' ? '٪' : '' }}</span>
              <span class="preview-unit">{{ form.discountType === 'percentage' ? 'تخفیف' : 'تومان تخفیف' }}</span>
            </div>
          </div>
          <div class="preview-title">{{ form.title || 'عنوان تخفیف' }}</div>
          <div v-if="dateRangeText" class="preview-range">
            {{ dateRangeText }}
          </div>
        </div>

        <!-- Action card -->
        <div class="action-card">
          <AdminButton type="submit" variant="primary" :loading="saving" class="submit-btn">
            {{ isEdit ? 'ذخیره تغییرات' : 'ایجاد تخفیف' }}
          </AdminButton>
          <router-link to="/time-discounts">
            <AdminButton type="button" variant="ghost" class="cancel-btn">انصراف</AdminButton>
          </router-link>
        </div>

      </div><!-- /form-side -->

    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'
import { useDebounce } from '@/composables/useDebounce'
import AdminButton from '@/components/common/AdminButton.vue'
import AdminInput  from '@/components/common/AdminInput.vue'
import { timeDiscountService } from '@/services/time-discount.service'
import { categoryService }     from '@/services/category.service'
import { productService }      from '@/services/product.service'
import DatePicker from 'vue3-persian-datetime-picker'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const isEdit = computed(() => !!route.params.id)

const form = ref({
  title: '',
  discountType: 'percentage',
  value: 0,
  maxDiscountAmount: null,
  startDate: '',
  endDate: '',
  targetType: 'all',
  targetIds: [],
  minOrderAmount: null,
  maxUsageCount: null,
})

const errors  = ref({})
const saving  = ref(false)

const productSearch    = ref('')
const productResults   = ref([])
const selectedProducts = ref([])
const allCategories    = ref([])

const targetOptions = [
  { value: 'all',        label: 'همه محصولات',   icon: '🛍️' },
  { value: 'products',   label: 'محصولات خاص',   icon: '📦' },
  { value: 'categories', label: 'دسته‌بندی خاص', icon: '🗂️' },
]

const valueHint = computed(() => {
  const v = form.value.value
  if (!v || v <= 0) return ''
  if (form.value.discountType === 'percentage') {
    if (v > 100) return ''
    return `تخفیف ${v}٪ اعمال خواهد شد`
  }
  return `${Number(v).toLocaleString('fa-IR')} تومان از قیمت کسر می‌شود`
})

const _jalaliFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric', month: '2-digit', day: '2-digit',
})
function toJalali(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return ''
    return _jalaliFmt.format(d)
  } catch { return '' }
}

const dateRangeText = computed(() => {
  const s = toJalali(form.value.startDate)
  const e = toJalali(form.value.endDate)
  if (!s && !e) return ''
  if (s && !e) return `از ${s}`
  if (!s && e) return `تا ${e}`
  return `از ${s} تا ${e}`
})

const durationText = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return ''
  const s = new Date(form.value.startDate)
  const e = new Date(form.value.endDate)
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return ''
  const diffMs  = e - s
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHr  = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (diffDay >= 1) return `${diffDay} روز${diffHr > 0 ? ` و ${diffHr} ساعت` : ''}`
  return `${diffHr} ساعت`
})

const debouncedSearch = useDebounce(async (q) => {
  if (!q) { productResults.value = []; return }
  const { data } = await productService.getAll({ search: q, limit: 10 })
  productResults.value = data?.products ?? []
}, 400)

function searchProducts() { debouncedSearch(productSearch.value) }

function selectProduct(p) {
  if (!selectedProducts.value.find((x) => x._id === p._id)) {
    selectedProducts.value.push(p)
    form.value.targetIds = selectedProducts.value.map((x) => x._id)
  }
  productSearch.value  = ''
  productResults.value = []
}

function removeProduct(id) {
  selectedProducts.value = selectedProducts.value.filter((p) => p._id !== id)
  form.value.targetIds   = selectedProducts.value.map((x) => x._id)
}

async function loadCategories() {
  const { data } = await categoryService.getAll({ limit: 200 })
  allCategories.value = data?.categories ?? data?.items ?? []
}

async function loadDiscount() {
  const { data } = await timeDiscountService.getById(route.params.id)
  form.value = {
    title:             data.title,
    discountType:      data.discountType,
    value:             data.value,
    maxDiscountAmount: data.maxDiscountAmount ?? null,
    startDate:         data.startDate ? data.startDate.slice(0, 19) : '',
    endDate:           data.endDate   ? data.endDate.slice(0, 19)   : '',
    targetType:        data.targetType,
    targetIds:         data.targetIds ?? [],
    minOrderAmount:    data.minOrderAmount ?? null,
    maxUsageCount:     data.maxUsageCount  ?? null,
  }
}

function validate() {
  errors.value = {}
  if (!form.value.title.trim())  errors.value.title = 'عنوان الزامی است'
  if (form.value.value <= 0)     errors.value.value = 'مقدار باید بیشتر از صفر باشد'
  if (form.value.discountType === 'percentage' && form.value.value > 100)
    errors.value.value = 'درصد نمی‌تواند بیشتر از ۱۰۰ باشد'
  if (!form.value.startDate)     errors.value.startDate = 'تاریخ شروع الزامی است'
  if (!form.value.endDate)       errors.value.endDate   = 'تاریخ پایان الزامی است'
  if (form.value.startDate && form.value.endDate &&
      new Date(form.value.endDate) <= new Date(form.value.startDate))
    errors.value.endDate = 'تاریخ پایان باید بعد از تاریخ شروع باشد'
  return !Object.keys(errors.value).length
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      ...form.value,
      maxDiscountAmount: form.value.maxDiscountAmount || null,
      minOrderAmount:    form.value.minOrderAmount    || null,
      maxUsageCount:     form.value.maxUsageCount     || null,
    }
    if (isEdit.value) {
      await timeDiscountService.update(route.params.id, payload)
      ui.addToast('تخفیف با موفقیت ویرایش شد', 'success')
    } else {
      await timeDiscountService.create(payload)
      ui.addToast('تخفیف با موفقیت ایجاد شد', 'success')
    }
    router.push('/time-discounts')
  } catch (err) {
    const msg = err?.response?.data?.message ?? 'خطا در ذخیره اطلاعات'
    ui.addToast(Array.isArray(msg) ? msg.join(' | ') : msg, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  if (isEdit.value) await loadDiscount()
})
</script>

<!-- Global: ensures date-picker input text is always visible on this page -->
<style>
.vpd-input-group input.date-input {
  color: var(--color-text-primary, #0f172a) !important;
  background-color: var(--color-card, #ffffff) !important;
  caret-color: var(--color-text-primary, #0f172a) !important;
}
.vpd-input-group input.date-input::placeholder {
  color: var(--color-text-disabled, #94a3b8) !important;
}
html.dark .vpd-input-group input.date-input {
  color: #f1f5f9 !important;
  background-color: #1e293b !important;
}
</style>

<style scoped>
/* ── Layout ── */
.page-wrapper { padding: 1.5rem; }

.page-header  { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1.75rem; }
.header-left  { display: flex; align-items: center; gap: 0.75rem; }
.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: var(--color-surface); color: var(--color-text-secondary);
  border: 1px solid var(--color-border); transition: all 0.15s; text-decoration: none;
}
.back-btn:hover { background: var(--color-border); color: var(--color-text-primary); }
.page-title   { font-size: 1.2rem; font-weight: 700; color: var(--color-text-primary); line-height: 1.3; }
.page-subtitle { font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.15rem; }

.form-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 860px) {
  .form-layout { grid-template-columns: 1fr; }
  .form-side   { order: -1; }
}

/* ── Form sections ── */
.form-main { display: flex; flex-direction: column; gap: 1rem; }

.form-section {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 1.25rem 1.25rem 0.75rem;
}

.section-head {
  display: flex; align-items: center; gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}
.section-icon  { font-size: 1rem; line-height: 1; }
.section-label { font-size: 0.875rem; font-weight: 700; color: var(--color-text-primary); }

.form-group { margin-bottom: 1rem; }
.form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 560px) { .form-row { grid-template-columns: 1fr; } }

.field-label {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.8rem; font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.4rem;
}
.req { color: #ef4444; }

.field-hint  { font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.3rem; line-height: 1.5; }
.hint-green  { color: #16a34a !important; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 0.25rem; }

.badge-opt {
  font-size: 0.68rem; font-weight: 500;
  padding: 1px 7px; border-radius: 20px;
  background: var(--color-surface); color: var(--color-text-secondary);
  border: 1px solid var(--color-border); margin-right: auto;
}

.optional-group {
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

/* ── Type toggle ── */
.type-toggle {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
}
.toggle-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.6rem 1rem; border-radius: 10px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
  background: var(--color-surface); color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border);
}
.toggle-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.toggle-active {
  background: var(--color-primary) !important;
  color: #fff !important;
  border-color: var(--color-primary) !important;
}
.toggle-symbol { font-size: 1rem; line-height: 1; font-weight: 700; }

/* ── Value input with prefix badge ── */
.value-wrap { display: flex; align-items: stretch; }
.val-badge {
  display: flex; align-items: center; justify-content: center;
  padding: 0 0.65rem; flex-shrink: 0;
  font-size: 0.75rem; font-weight: 700;
  border-radius: 8px 0 0 8px;
  border: 1.5px solid; border-left: none;
}
.val-pct { background: rgba(99,102,241,0.1); color: #6366f1; border-color: rgba(99,102,241,0.3); }
.val-fix { background: rgba(245,158,11,0.1); color: #d97706; border-color: rgba(245,158,11,0.3); }
.val-input :deep(input) {
  border-right: none !important;
  border-radius: 0 8px 8px 0 !important;
}

/* ── Date range ── */
.date-range {
  display: grid; grid-template-columns: 1fr auto 1fr;
  gap: 0.75rem; align-items: end;
}
.date-sep {
  display: flex; align-items: center; justify-content: center;
  padding-bottom: 0.45rem;
  color: var(--color-text-secondary);
}
.date-group { display: flex; flex-direction: column; }
@media (max-width: 480px) {
  .date-range { grid-template-columns: 1fr; }
  .date-sep   { display: none; }
}

.date-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  background: var(--color-bg, #fff);
  color: var(--color-text-primary, #0f172a);
  transition: border-color 0.15s;
  outline: none;
}
.date-input:focus { border-color: var(--color-primary); }

.duration-bar {
  display: inline-flex; align-items: center; gap: 0.35rem;
  margin-top: 0.75rem; margin-bottom: 0.25rem;
  font-size: 0.75rem; font-weight: 500;
  color: #2563eb;
  background: rgba(37,99,235,0.07);
  border: 1px solid rgba(37,99,235,0.18);
  padding: 0.3rem 0.65rem; border-radius: 20px;
  flex-wrap: wrap;
}
.dur-sep  { color: rgba(37,99,235,0.4); margin: 0 0.1rem; }
.dur-days { font-weight: 700; }

/* ── Target grid ── */
.target-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;
}
.target-btn {
  display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
  padding: 0.65rem 0.4rem; border-radius: 10px; cursor: pointer;
  font-size: 0.78rem; font-weight: 600; text-align: center;
  transition: all 0.15s;
  background: var(--color-surface); color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border);
}
.target-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.target-active {
  background: rgba(27,79,138,0.08) !important;
  color: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
}
.target-icon { font-size: 1.25rem; line-height: 1; }

/* ── Product search ── */
.multiselect-wrap { position: relative; }
.search-wrap {
  display: flex; align-items: center; gap: 0.4rem;
  border: 1.5px solid var(--color-border); border-radius: 8px;
  padding: 0.45rem 0.65rem;
  background: var(--color-bg, #fff);
  transition: border-color 0.15s;
}
.search-wrap:focus-within { border-color: var(--color-primary); }
.s-icon { color: var(--color-text-secondary); flex-shrink: 0; }
.search-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 0.875rem; color: var(--color-text-primary); font-family: inherit;
}
.search-input::placeholder { color: var(--color-text-disabled, #94a3b8); }

.dropdown-list {
  position: absolute; left: 0; right: 0; z-index: 50;
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  max-height: 200px; overflow-y: auto; margin-top: 4px;
}
.dropdown-item {
  padding: 0.5rem 0.75rem; cursor: pointer;
  font-size: 0.875rem; color: var(--color-text-primary);
  transition: background 0.1s;
}
.dropdown-item:hover { background: var(--color-surface); }

.selected-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
.stag {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.2rem 0.5rem; border-radius: 20px;
  font-size: 0.78rem; font-weight: 500;
  background: rgba(37,99,235,0.08); color: #2563eb;
  border: 1px solid rgba(37,99,235,0.2);
}
.stag button {
  background: none; border: none; cursor: pointer;
  color: #94a3b8; font-size: 0.9rem; line-height: 1; padding: 0 2px;
  transition: color 0.1s;
}
.stag button:hover { color: #ef4444; }

/* ── Categories list ── */
.cat-list {
  border: 1.5px solid var(--color-border); border-radius: 8px;
  max-height: 220px; overflow-y: auto;
  background: var(--color-bg, #fff);
}
.cat-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem; cursor: pointer;
  font-size: 0.85rem; color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  transition: background 0.1s;
}
.cat-item:last-child { border-bottom: none; }
.cat-item:hover { background: var(--color-surface); }
.cat-checkbox { accent-color: var(--color-primary); width: 14px; height: 14px; }

/* ── Sidebar ── */
.form-side { display: flex; flex-direction: column; gap: 0.75rem; position: sticky; top: 1rem; }

.preview-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 14px; padding: 1rem 1.25rem;
  text-align: center; overflow: hidden; position: relative;
}
.preview-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}
.preview-label-top {
  font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em;
  color: var(--color-text-secondary); margin-bottom: 0.75rem;
}
.preview-badge-wrap { display: flex; justify-content: center; margin-bottom: 0.75rem; }
.preview-badge {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 90px; height: 90px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 20px rgba(99,102,241,0.35);
  color: #fff;
}
.preview-val  { font-size: 1.6rem; font-weight: 900; line-height: 1; }
.preview-unit { font-size: 0.65rem; font-weight: 600; opacity: 0.85; margin-top: 2px; }
.preview-title {
  font-size: 0.85rem; font-weight: 700;
  color: var(--color-text-primary); margin-bottom: 0.5rem;
}
.preview-range {
  display: flex; align-items: center; justify-content: center; gap: 0.35rem;
  font-size: 0.7rem; color: var(--color-text-secondary); direction: ltr;
}

.action-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 14px; padding: 1rem;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.submit-btn { width: 100%; }
.cancel-btn { width: 100%; display: block; }
</style>
