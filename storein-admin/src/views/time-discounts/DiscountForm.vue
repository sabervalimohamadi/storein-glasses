<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? 'ویرایش تخفیف' : 'تخفیف جدید' }}</h1>
      <router-link to="/time-discounts">
        <AdminButton variant="ghost">بازگشت</AdminButton>
      </router-link>
    </div>

    <form class="card form-card" @submit.prevent="submit">
      <!-- Title -->
      <div class="form-group">
        <label>عنوان تخفیف <span class="required">*</span></label>
        <AdminInput v-model="form.title" placeholder="مثال: جشنواره عید" :error="errors.title" />
      </div>

      <!-- Type -->
      <div class="form-group">
        <label>نوع تخفیف <span class="required">*</span></label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="form.discountType" value="percentage" />
            درصدی
          </label>
          <label class="radio-label">
            <input type="radio" v-model="form.discountType" value="fixed" />
            مبلغ ثابت
          </label>
        </div>
      </div>

      <!-- Value -->
      <div class="form-group">
        <label>مقدار <span class="required">*</span></label>
        <div class="input-suffix-wrap">
          <AdminInput
            v-model.number="form.value"
            type="number"
            :min="0"
            :max="form.discountType === 'percentage' ? 100 : undefined"
            :error="errors.value"
          />
          <span class="suffix">{{ form.discountType === 'percentage' ? '٪' : 'تومان' }}</span>
        </div>
      </div>

      <!-- Max discount (only for percentage) -->
      <div v-if="form.discountType === 'percentage'" class="form-group">
        <label>سقف تخفیف (تومان) <span class="hint">اختیاری</span></label>
        <AdminInput v-model.number="form.maxDiscountAmount" type="number" :min="0" placeholder="بدون سقف" />
      </div>

      <!-- Dates -->
      <div class="form-row">
        <div class="form-group">
          <label>تاریخ شروع <span class="required">*</span></label>
          <date-picker
            v-model="form.startDate"
            type="datetime"
            format="YYYY-MM-DDTHH:mm:ss"
            display-format="jYYYY/jMM/jDD HH:mm"
            :clearable="false"
            input-class="admin-date-input"
            :error="errors.startDate"
          />
        </div>
        <div class="form-group">
          <label>تاریخ پایان <span class="required">*</span></label>
          <date-picker
            v-model="form.endDate"
            type="datetime"
            format="YYYY-MM-DDTHH:mm:ss"
            display-format="jYYYY/jMM/jDD HH:mm"
            :clearable="false"
            input-class="admin-date-input"
            :error="errors.endDate"
          />
        </div>
      </div>

      <!-- Target -->
      <div class="form-group">
        <label>هدف تخفیف <span class="required">*</span></label>
        <AdminSelect v-model="form.targetType" :options="targetOptions" />
      </div>

      <!-- Products multi-select -->
      <div v-if="form.targetType === 'products'" class="form-group">
        <label>محصولات</label>
        <div class="multiselect-wrap">
          <input
            v-model="productSearch"
            class="search-input"
            placeholder="جستجوی محصول..."
            @input="searchProducts"
          />
          <div v-if="productResults.length" class="dropdown-list">
            <div
              v-for="p in productResults"
              :key="p._id"
              class="dropdown-item"
              @click="selectProduct(p)"
            >
              {{ p.name }}
            </div>
          </div>
          <div class="selected-tags">
            <span v-for="p in selectedProducts" :key="p._id" class="tag">
              {{ p.name }}
              <button type="button" @click="removeProduct(p._id)">×</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Categories multi-select -->
      <div v-if="form.targetType === 'categories'" class="form-group">
        <label>دسته‌بندی‌ها</label>
        <div class="multiselect-wrap">
          <div class="dropdown-list static-list">
            <label v-for="c in allCategories" :key="c._id" class="cat-item">
              <input type="checkbox" :value="c._id" v-model="form.targetIds" />
              {{ c.name }}
            </label>
          </div>
        </div>
      </div>

      <!-- Min order / Max usage -->
      <div class="form-row">
        <div class="form-group">
          <label>حداقل مبلغ سفارش (تومان) <span class="hint">اختیاری</span></label>
          <AdminInput v-model.number="form.minOrderAmount" type="number" :min="0" placeholder="بدون محدودیت" />
        </div>
        <div class="form-group">
          <label>حداکثر تعداد استفاده <span class="hint">اختیاری</span></label>
          <AdminInput v-model.number="form.maxUsageCount" type="number" :min="1" placeholder="نامحدود" />
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <AdminButton type="submit" variant="primary" :loading="saving">
          {{ isEdit ? 'ذخیره تغییرات' : 'ایجاد تخفیف' }}
        </AdminButton>
        <router-link to="/time-discounts">
          <AdminButton type="button" variant="ghost">انصراف</AdminButton>
        </router-link>
      </div>
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
import AdminSelect from '@/components/common/AdminSelect.vue'
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

const productSearch   = ref('')
const productResults  = ref([])
const selectedProducts = ref([])
const allCategories   = ref([])

const targetOptions = [
  { value: 'all',        label: 'همه محصولات' },
  { value: 'products',   label: 'محصولات خاص' },
  { value: 'categories', label: 'دسته‌بندی خاص' },
]

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
  selectedProducts.value   = selectedProducts.value.filter((p) => p._id !== id)
  form.value.targetIds = selectedProducts.value.map((x) => x._id)
}

async function loadCategories() {
  const { data } = await categoryService.getAll({ limit: 200 })
  allCategories.value = data?.categories ?? data?.items ?? []
}

async function loadDiscount() {
  const { data } = await timeDiscountService.getById(route.params.id)
  const d = data
  form.value = {
    title:            d.title,
    discountType:     d.discountType,
    value:            d.value,
    maxDiscountAmount: d.maxDiscountAmount ?? null,
    startDate:        d.startDate ? d.startDate.slice(0, 16) : '',
    endDate:          d.endDate   ? d.endDate.slice(0, 16)   : '',
    targetType:       d.targetType,
    targetIds:        d.targetIds ?? [],
    minOrderAmount:   d.minOrderAmount ?? null,
    maxUsageCount:    d.maxUsageCount  ?? null,
  }
}

function validate() {
  errors.value = {}
  if (!form.value.title.trim())   errors.value.title = 'عنوان الزامی است'
  if (form.value.value <= 0)      errors.value.value = 'مقدار باید بیشتر از صفر باشد'
  if (form.value.discountType === 'percentage' && form.value.value > 100)
    errors.value.value = 'درصد نمی‌تواند بیشتر از ۱۰۰ باشد'
  if (!form.value.startDate)      errors.value.startDate = 'تاریخ شروع الزامی است'
  if (!form.value.endDate)        errors.value.endDate   = 'تاریخ پایان الزامی است'
  if (form.value.startDate && form.value.endDate && new Date(form.value.endDate) <= new Date(form.value.startDate))
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

<style scoped>
.page-wrapper { padding: 1.5rem; }
.page-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-title   { font-size: 1.25rem; font-weight: 700; }

.form-card    { padding: 1.5rem; max-width: 720px; }
.form-group   { margin-bottom: 1.25rem; }
.form-row     { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.4rem; }
.required     { color: #ef4444; margin-right: 0.15rem; }
.hint         { color: #9ca3af; font-weight: 400; font-size: 0.8rem; }

.radio-group  { display: flex; gap: 1.5rem; }
.radio-label  { display: flex; align-items: center; gap: 0.35rem; cursor: pointer; }

.input-suffix-wrap { display: flex; align-items: center; gap: 0.5rem; }
.suffix       { white-space: nowrap; font-size: 0.9rem; color: #6b7280; }

.multiselect-wrap { position: relative; }
.search-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; }
.dropdown-list { border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; max-height: 200px; overflow-y: auto; margin-top: 0.25rem; }
.dropdown-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.875rem; }
.dropdown-item:hover { background: #f3f4f6; }
.static-list { padding: 0.5rem; }
.cat-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 0.25rem; cursor: pointer; font-size: 0.875rem; }

.selected-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
.tag { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.5rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px; font-size: 0.8rem; }
.tag button { background: none; border: none; cursor: pointer; color: #6b7280; line-height: 1; }

.admin-date-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; }

.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }

@media (max-width: 640px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
