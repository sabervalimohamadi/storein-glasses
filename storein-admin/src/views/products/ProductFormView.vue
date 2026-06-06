<template>
  <div>

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <button @click="$router.back()"
          class="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <div>
          <h1 class="page-title">{{ isEdit ? 'ویرایش محصول' : 'محصول جدید' }}</h1>
          <p v-if="isEdit && form.name" class="text-text-secondary text-sm mt-0.5 truncate max-w-xs">
            {{ form.name }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <AdminButton variant="secondary" @click="saveDraft" :loading="savingDraft">
          💾 ذخیره پیش‌نویس
        </AdminButton>
        <AdminButton @click="publish" :loading="savingPublish">
          🚀 {{ isEdit ? 'ذخیره تغییرات' : 'انتشار محصول' }}
        </AdminButton>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loadingProduct" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 space-y-4">
        <AdminSkeleton height="200px" class="rounded-xl" />
        <AdminSkeleton height="300px" class="rounded-xl" />
      </div>
      <div class="space-y-4">
        <AdminSkeleton height="150px" class="rounded-xl" />
        <AdminSkeleton height="120px" class="rounded-xl" />
      </div>
    </div>

    <!-- Form -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

      <!-- LEFT: main content -->
      <div class="lg:col-span-2 space-y-5">

        <!-- اطلاعات پایه -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>📋</span> اطلاعات پایه
          </h2>
          <div class="space-y-4">

            <AdminInput
              v-model="form.name"
              label="نام محصول"
              placeholder="مثلاً: عینک آفتابی ری‌بن مدل آویاتور"
              required
              :error="errors.name"
            />

            <div v-if="isEdit">
              <label class="field-label">آدرس (Slug)</label>
              <input :value="form.slug" readonly dir="ltr"
                class="field-input bg-surface text-text-secondary cursor-not-allowed text-sm" />
              <p class="text-text-disabled text-xs mt-1">اسلاگ پس از ایجاد قابل تغییر نیست</p>
            </div>

            <AdminSelect
              v-model="form.categoryId"
              label="دسته‌بندی"
              placeholder="یک دسته انتخاب کنید"
              :options="categoryOptions"
              required
              :error="errors.categoryId"
            />

            <AdminSelect
              v-model="form.brandId"
              label="برند"
              :options="brandOptions"
            />

            <AdminTextarea
              v-model="form.description"
              label="توضیحات محصول"
              placeholder="ویژگی‌ها، جنس، مزایا و اطلاعات بیشتر درباره محصول را بنویسید..."
              :rows="5"
            />
          </div>
        </div>

        <!-- تنوع‌های محصول -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>🎨</span> تنوع‌های محصول
            <span class="text-text-disabled font-normal text-xs mr-1">(حداقل یک تنوع الزامی است)</span>
          </h2>
          <VariantEditor v-model="form.variants" :errors="variantErrors" />
          <p v-if="errors.variants" class="text-error text-xs mt-2">{{ errors.variants }}</p>
        </div>

      </div>

      <!-- RIGHT: sidebar -->
      <div class="space-y-5">

        <!-- وضعیت -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>⚙️</span> وضعیت
          </h2>
          <div class="space-y-2">
            <label
              v-for="opt in statusOptions"
              :key="opt.value"
              :class="[
                'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150',
                form.status === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/70',
              ]"
            >
              <input type="radio" :value="opt.value" v-model="form.status" class="accent-primary" />
              <div>
                <p class="text-sm font-medium text-text-primary">{{ opt.label }}</p>
                <p class="text-text-disabled text-xs">{{ opt.hint }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- تصاویر -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>📸</span> تصاویر محصول
          </h2>
          <ImageUploader v-model="form.images" :max-images="8" />
        </div>

        <!-- برچسب‌ها -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>🏷️</span> برچسب‌ها
          </h2>
          <TagInput v-model="form.tags" />
        </div>

        <!-- آمار (edit only) -->
        <div v-if="isEdit && originalProduct" class="admin-card">
          <h2 class="section-title mb-3">آمار محصول</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-text-secondary">بازدید</span>
              <span class="font-fanum font-medium">{{ formatNumber(originalProduct.viewCount ?? 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">تعداد نظرات</span>
              <span class="font-fanum font-medium">{{ formatNumber(originalProduct.reviewCount ?? 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">میانگین امتیاز</span>
              <span class="font-fanum font-medium">{{ originalProduct.avgRating?.toFixed(1) ?? '—' }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService }  from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { brandService }    from '@/services/brand.service'
import { useUiStore }      from '@/stores/ui.store'
import { formatNumber }    from '@/utils/formatters'

import ImageUploader from './components/ImageUploader.vue'
import VariantEditor from './components/VariantEditor.vue'
import TagInput      from './components/TagInput.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminSelect   from '@/components/common/AdminSelect.vue'
import AdminTextarea from '@/components/common/AdminTextarea.vue'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const isEdit = computed(() => !!route.params.id)

const loadingProduct  = ref(false)
const savingDraft     = ref(false)
const savingPublish   = ref(false)
const categories      = ref([])
const brands          = ref([])
const originalProduct = ref(null)

const form = reactive({
  name:        '',
  slug:        '',
  description: '',
  categoryId:  '',
  brandId:     '',
  images:      [],
  variants:    [{ sku: '', price: 0, comparePrice: 0, stock: 0, attributes: {} }],
  tags:        [],
  status:      'draft',
})

const errors        = reactive({})
const variantErrors = ref({})

const categoryOptions = computed(() =>
  categories.value.map(c => ({ value: c._id, label: c.name }))
)
const brandOptions = computed(() => [
  { value: '', label: '— بدون برند —' },
  ...brands.value.map(b => ({ value: b._id, label: b.name })),
])

const statusOptions = [
  { value: 'active',   label: 'فعال',       hint: 'محصول در سایت نمایش داده می‌شود' },
  { value: 'draft',    label: 'پیش‌نویس',   hint: 'ذخیره شده اما نمایش داده نمی‌شود' },
  { value: 'inactive', label: 'غیرفعال',    hint: 'مخفی و غیرقابل خرید' },
]

// ── Validation ────────────────────────────────────
function validate(targetStatus) {
  Object.keys(errors).forEach(k => delete errors[k])
  variantErrors.value = {}
  let valid = true

  if (!form.name.trim() || form.name.length < 3) {
    errors.name = 'نام محصول حداقل ۳ کاراکتر باشد'
    valid = false
  }
  if (!form.categoryId) {
    errors.categoryId = 'دسته‌بندی الزامی است'
    valid = false
  }
  if (!form.variants.length) {
    errors.variants = 'حداقل یک تنوع الزامی است'
    valid = false
  }

  if (targetStatus === 'active') {
    form.variants.forEach((v, idx) => {
      const ve = {}
      if (!v.price || v.price <= 0) ve.price = 'قیمت الزامی است'
      if (v.stock < 0)              ve.stock = 'موجودی نمی‌تواند منفی باشد'
      if (Object.keys(ve).length)   variantErrors.value[idx] = ve
    })
    if (Object.keys(variantErrors.value).length) valid = false
  }

  return valid
}

// ── Build DTO ─────────────────────────────────────
function buildDto(statusOverride) {
  return {
    name:        form.name.trim(),
    description: form.description.trim() || undefined,
    category:    form.categoryId,
    brand:       form.brandId || undefined,
    images:      form.images.map(img =>
      img?.original?.url || img?.url || (typeof img === 'string' ? img : null)
    ).filter(Boolean),
    thumbnail:   (() => {
      const first = form.images[0]
      if (!first) return undefined
      if (typeof first === 'string') return first
      return first.thumbnail?.url || first.original?.url
    })(),
    variants:    form.variants.map(v => ({
      ...(v._id ? { _id: v._id } : {}),
      sku:          v.sku?.trim() || '',
      price:        Number(v.price),
      comparePrice: v.comparePrice > 0 ? Number(v.comparePrice) : undefined,
      stock:        Number(v.stock),
      attributes:   Object.entries(v.attributes || {})
        .filter(([k, val]) => k && val)
        .map(([key, value]) => ({ key: String(key), value: String(value) })),
    })),
    tags:   form.tags.filter(Boolean),
    status: statusOverride ?? form.status,
  }
}

// ── Save handlers ─────────────────────────────────
async function saveDraft() {
  if (!validate('draft')) return
  savingDraft.value = true
  try {
    const dto = buildDto('draft')
    if (isEdit.value) {
      await productService.update(route.params.id, dto)
      ui.addToast('پیش‌نویس ذخیره شد', 'success')
    } else {
      const { data } = await productService.create(dto)
      ui.addToast('محصول به صورت پیش‌نویس ذخیره شد', 'success')
      router.replace({ name: 'product-edit', params: { id: data._id } })
    }
  } catch (err) {
    ui.addToast(err.response?.data?.message ?? 'خطا در ذخیره', 'error')
  } finally {
    savingDraft.value = false
  }
}

async function publish() {
  if (!validate('active')) return
  savingPublish.value = true
  try {
    const dto = buildDto('active')
    if (isEdit.value) {
      await productService.update(route.params.id, dto)
      ui.addToast('محصول با موفقیت ذخیره شد ✓', 'success')
    } else {
      await productService.create(dto)
      ui.addToast('محصول با موفقیت منتشر شد ✓', 'success')
      router.push({ name: 'products' })
    }
  } catch (err) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) msg.forEach(m => ui.addToast(m, 'error'))
    else ui.addToast(msg ?? 'خطا در ذخیره محصول', 'error')
  } finally {
    savingPublish.value = false
  }
}

// ── Fill form from product ────────────────────────
function fillForm(p) {
  form.name        = p.name        ?? ''
  form.slug        = p.slug        ?? ''
  form.description = p.description ?? ''
  form.categoryId  = p.category?._id  ?? p.category  ?? ''
  form.brandId     = p.brand?._id     ?? p.brand     ?? ''
  form.images      = p.images      ?? []
  form.tags        = p.tags        ?? []
  form.status      = p.status      ?? 'draft'
  form.variants    = p.variants?.length
    ? p.variants.map(v => ({
        _id:          v._id,
        sku:          v.sku          ?? '',
        price:        v.price        ?? 0,
        comparePrice: v.comparePrice ?? 0,
        stock:        v.stock        ?? 0,
        attributes:   Array.isArray(v.attributes)
          ? Object.fromEntries(v.attributes.map(a => [a.key, a.value]))
          : (v.attributes ?? {}),
      }))
    : [{ sku: '', price: 0, comparePrice: 0, stock: 0, attributes: {} }]
}

// ── Lifecycle ─────────────────────────────────────
onMounted(async () => {
  try {
    const [catRes, brandRes] = await Promise.allSettled([
      categoryService.getAll({ limit: 200 }),
      brandService.getAll(),
    ])
    if (catRes.status === 'fulfilled')
      categories.value = Array.isArray(catRes.value.data) ? catRes.value.data : (catRes.value.data?.items ?? [])
    if (brandRes.status === 'fulfilled')
      brands.value = Array.isArray(brandRes.value.data) ? brandRes.value.data : []
  } catch { /* non-critical */ }

  if (isEdit.value) {
    loadingProduct.value = true
    try {
      const { data } = await productService.getById(route.params.id)
      originalProduct.value = data
      fillForm(data)
    } catch {
      ui.addToast('خطا در بارگذاری محصول', 'error')
      router.push({ name: 'products' })
    } finally {
      loadingProduct.value = false
    }
  }
})
</script>
