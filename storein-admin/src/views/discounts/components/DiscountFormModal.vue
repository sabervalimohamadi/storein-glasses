<template>
  <AdminModal
    :modelValue="modelValue"
    :title="isEdit ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'"
    size="lg"
    @close="$emit('update:modelValue', false)">

    <div class="space-y-5">

      <!-- ── Live preview badge ── -->
      <div class="flex items-center justify-center">
        <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border-2 border-dashed transition-all"
             :class="form.code ? 'border-primary/40 bg-primary/5' : 'border-border bg-surface'">
          <code class="font-mono font-black tracking-widest text-base"
                :class="form.code ? 'text-primary' : 'text-text-disabled'">
            {{ form.code || 'SUMMER20' }}
          </code>
          <span v-if="previewLabel"
                class="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                :style="{ background: form.type === 'percentage' ? '#16a34a' : '#2563eb' }">
            {{ previewLabel }}
          </span>
        </div>
      </div>

      <!-- ── Section: کد و توضیح ── -->
      <div class="space-y-3">
        <p class="text-xs font-bold text-text-disabled uppercase tracking-wider flex items-center gap-2">
          <span class="h-px flex-1 bg-border"></span> کد تخفیف <span class="h-px flex-1 bg-border"></span>
        </p>

        <div>
          <label class="field-label">
            کد تخفیف <span class="text-error">*</span>
          </label>
          <div class="flex gap-2">
            <input v-model="form.code"
              type="text" dir="ltr"
              placeholder="مثلاً: SUMMER20"
              @input="form.code = form.code.toUpperCase().replace(/[^A-Z0-9\-]/g, '')"
              :class="['field-input flex-1 uppercase font-mono tracking-widest',
                errors.code ? 'border-error ring-2 ring-error/15' : '']" />
            <button type="button"
              @click="generateCode"
              class="px-3 py-2 rounded-xl border border-border text-sm text-text-secondary
                     hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all
                     flex items-center gap-1.5 font-medium whitespace-nowrap">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              تولید خودکار
            </button>
          </div>
          <p v-if="errors.code" class="field-error">{{ errors.code }}</p>
          <p v-else class="text-text-disabled text-xs mt-1">فقط حروف انگلیسی، اعداد و خط‌تیره</p>
        </div>

        <AdminInput
          v-model="form.description"
          label="توضیحات (اختیاری)"
          placeholder="مثلاً: تخفیف ویژه تابستان" />
      </div>

      <!-- ── Section: میزان تخفیف ── -->
      <div class="space-y-3">
        <p class="text-xs font-bold text-text-disabled uppercase tracking-wider flex items-center gap-2">
          <span class="h-px flex-1 bg-border"></span> میزان تخفیف <span class="h-px flex-1 bg-border"></span>
        </p>

        <!-- Type toggle -->
        <div class="grid grid-cols-2 gap-2 p-1 rounded-xl" style="background: var(--color-surface);">
          <button
            v-for="opt in typeOptions" :key="opt.value"
            type="button"
            @click="form.type = opt.value"
            :class="[
              'py-2.5 rounded-lg text-sm font-semibold transition-all duration-150',
              form.type === opt.value
                ? 'bg-card shadow-sm text-primary'
                : 'text-text-secondary hover:text-text-primary',
            ]">
            <span class="text-base mr-1">{{ opt.icon }}</span>
            {{ opt.label }}
          </button>
        </div>

        <!-- Value input -->
        <div>
          <label class="field-label">
            مقدار تخفیف <span class="text-error">*</span>
          </label>
          <div :class="[
            'flex items-stretch border rounded-xl overflow-hidden transition-all',
            errors.value
              ? 'border-error ring-2 ring-error/15'
              : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15',
          ]">
            <span class="flex items-center px-3.5 border-l border-border text-sm font-bold shrink-0"
                  :class="form.type === 'percentage' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'">
              {{ form.type === 'percentage' ? '٪' : 'تومان' }}
            </span>
            <input v-model.number="form.value"
              type="number" min="1"
              :max="form.type === 'percentage' ? 100 : undefined"
              dir="ltr"
              :placeholder="form.type === 'percentage' ? '20' : '500000'"
              class="flex-1 px-3.5 py-2.5 outline-none text-sm font-fanum"
              style="background:transparent; color: var(--color-text-primary);" />
          </div>
          <p v-if="errors.value" class="field-error">{{ errors.value }}</p>
        </div>

        <!-- Max discount — percentage only -->
        <div v-if="form.type === 'percentage'"
             class="rounded-xl p-3 flex items-center gap-3"
             style="background: var(--color-surface);">
          <div class="flex-1">
            <label class="field-label mb-1">سقف مبلغ تخفیف (تومان، اختیاری)</label>
            <input v-model.number="form.maxDiscount"
              type="number" min="0" dir="ltr"
              placeholder="مثلاً: 500000"
              class="field-input w-full text-sm font-fanum" />
          </div>
          <div class="text-text-disabled text-xs text-center shrink-0 mt-5">
            <svg class="w-5 h-5 mx-auto mb-0.5 opacity-40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            اگر خالی: بدون سقف
          </div>
        </div>
      </div>

      <!-- ── Section: شرایط اعمال ── -->
      <div class="space-y-3">
        <p class="text-xs font-bold text-text-disabled uppercase tracking-wider flex items-center gap-2">
          <span class="h-px flex-1 bg-border"></span> شرایط اعمال <span class="h-px flex-1 bg-border"></span>
        </p>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">حداقل مبلغ سبد (تومان)</label>
            <input v-model.number="form.minOrderAmount"
              type="number" min="0" dir="ltr"
              placeholder="بدون محدودیت"
              class="field-input w-full text-sm font-fanum" />
          </div>
          <div>
            <label class="field-label">سقف تعداد استفاده</label>
            <input v-model.number="form.usageLimit"
              type="number" min="1" dir="ltr"
              placeholder="نامحدود"
              class="field-input w-full text-sm font-fanum" />
          </div>
        </div>
      </div>

      <!-- ── Section: بازه زمانی ── -->
      <div class="space-y-3">
        <p class="text-xs font-bold text-text-disabled uppercase tracking-wider flex items-center gap-2">
          <span class="h-px flex-1 bg-border"></span> بازه زمانی <span class="h-px flex-1 bg-border"></span>
        </p>

        <div class="grid grid-cols-2 gap-3">
          <AdminDatePicker
            v-model="form.startDate"
            label="تاریخ شروع"
            placeholder="از ابتدا"
          />
          <AdminDatePicker
            v-model="form.endDate"
            label="تاریخ انقضا"
            placeholder="بدون انقضا"
            :error="errors.endDate"
          />
        </div>

        <!-- Validity visual hint -->
        <div v-if="form.startDate || form.endDate"
             class="rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs"
             style="background: var(--color-surface);">
          <svg class="w-4 h-4 shrink-0 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-text-secondary font-fanum">
            <span v-if="form.startDate">از {{ form.startDate }}</span>
            <span v-if="form.startDate && form.endDate"> تا </span>
            <span v-if="form.endDate">{{ form.endDate }}</span>
            <span v-else-if="form.startDate"> · بدون تاریخ انقضا</span>
          </span>
        </div>
        <p v-if="errors.endDate" class="field-error -mt-1">{{ errors.endDate }}</p>
      </div>

      <!-- ── Status toggle ── -->
      <div class="rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors"
           :class="form.isActive ? 'bg-success/8' : 'bg-surface'"
           @click="form.isActive = !form.isActive">
        <div>
          <p class="text-sm font-semibold" :class="form.isActive ? 'text-success' : 'text-text-secondary'">
            {{ form.isActive ? 'کد تخفیف فعال است' : 'کد تخفیف غیرفعال است' }}
          </p>
          <p class="text-xs text-text-disabled mt-0.5">
            {{ form.isActive ? 'مشتریان می‌توانند این کد را استفاده کنند' : 'کد قابل استفاده نیست' }}
          </p>
        </div>
        <!-- Toggle -->
        <div :class="[
          'relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0',
          form.isActive ? 'bg-success' : 'bg-gray-300 dark:bg-slate-600',
        ]">
          <span :class="[
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
            form.isActive ? 'translate-x-6 left-0.5' : 'translate-x-0 left-0.5',
          ]" />
        </div>
      </div>

    </div>

    <template #footer>
      <div class="flex gap-3">
        <AdminButton variant="ghost" class="flex-1"
          @click="$emit('update:modelValue', false)">
          انصراف
        </AdminButton>
        <AdminButton :loading="saving" class="flex-1" @click="submit">
          {{ isEdit ? 'ذخیره تغییرات' : 'ایجاد کد تخفیف' }}
        </AdminButton>
      </div>
    </template>
  </AdminModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { discountService } from '@/services/discount.service'
import { useUiStore }      from '@/stores/ui.store'
import { formatPrice }     from '@/utils/formatters'
import AdminModal      from '@/components/common/AdminModal.vue'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminDatePicker from '@/components/common/AdminDatePicker.vue'

const props = defineProps({
  modelValue: Boolean,
  discount:   { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])
const ui   = useUiStore()

const isEdit = computed(() => !!props.discount)
const saving = ref(false)

const form = reactive({
  code: '', description: '',
  type: 'percentage', value: null,
  maxDiscount: null, minOrderAmount: null,
  usageLimit: null, startDate: '', endDate: '',
  isActive: true,
})
const errors = reactive({ code: '', value: '', endDate: '' })

const typeOptions = [
  { value: 'percentage', label: 'درصدی', icon: '٪' },
  { value: 'fixed',      label: 'مبلغ ثابت', icon: '💰' },
]

const previewLabel = computed(() => {
  if (!form.value) return ''
  if (form.type === 'percentage') return `${form.value}٪ تخفیف`
  return `${formatPrice(form.value)} تومان`
})

watch(() => props.modelValue, (open) => {
  if (!open) return
  Object.keys(errors).forEach(k => (errors[k] = ''))
  if (props.discount) {
    const d = props.discount
    form.code           = d.code           ?? ''
    form.description    = d.description    ?? ''
    form.type           = d.type           ?? 'percentage'
    form.value          = d.value          ?? null
    form.maxDiscount    = d.maxDiscount    ?? null
    form.minOrderAmount = d.minOrderAmount ?? null
    form.usageLimit     = d.usageLimit     ?? null
    form.startDate      = d.startDate ? d.startDate.slice(0, 10) : ''
    form.endDate        = d.endDate   ? d.endDate.slice(0, 10)   : ''
    form.isActive       = d.isActive  ?? true
  } else {
    form.code = form.description = form.startDate = form.endDate = ''
    form.type = 'percentage'
    form.value = null
    form.maxDiscount = form.minOrderAmount = form.usageLimit = null
    form.isActive = true
  }
})

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  form.code = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

function validate() {
  Object.keys(errors).forEach(k => (errors[k] = ''))
  let ok = true
  if (!form.code.trim() || form.code.length < 3) {
    errors.code = 'کد حداقل ۳ کاراکتر باشد'
    ok = false
  }
  if (!form.value || form.value <= 0) {
    errors.value = 'مقدار تخفیف الزامی است'
    ok = false
  }
  if (form.type === 'percentage' && form.value > 100) {
    errors.value = 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد'
    ok = false
  }
  if (form.startDate && form.endDate && form.endDate <= form.startDate) {
    errors.endDate = 'تاریخ انقضا باید بعد از تاریخ شروع باشد'
    ok = false
  }
  return ok
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    const dto = {
      code:              form.code.trim(),
      description:       form.description.trim() || undefined,
      type:              form.type,
      value:             Number(form.value),
      maxDiscountAmount: form.maxDiscount    ? Number(form.maxDiscount)    : null,
      minOrderAmount:    form.minOrderAmount ? Number(form.minOrderAmount) : null,
      usageLimit:        form.usageLimit     ? Number(form.usageLimit)     : null,
      startDate:         form.startDate || null,
      endDate:           form.endDate   || null,
      isActive:          form.isActive,
    }
    let result
    if (isEdit.value) {
      const { data } = await discountService.update(props.discount._id, dto)
      result = data
      ui.addToast('کد تخفیف ویرایش شد', 'success')
    } else {
      const { data } = await discountService.create(dto)
      result = data
      ui.addToast('کد تخفیف ایجاد شد', 'success')
    }
    emit('saved', result)
    emit('update:modelValue', false)
  } catch (err) {
    const msg = err.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ذخیره'), 'error')
  } finally {
    saving.value = false
  }
}
</script>
