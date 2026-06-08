<template>
  <AdminModal
    :modelValue="modelValue"
    :title="isEdit ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'"
    size="lg"
    @close="$emit('update:modelValue', false)">

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

      <!-- Code -->
      <div class="sm:col-span-2">
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
          <AdminButton variant="secondary" size="md" @click="generateCode">
            تولید خودکار
          </AdminButton>
        </div>
        <p v-if="errors.code" class="field-error">{{ errors.code }}</p>
        <p v-else class="text-text-disabled text-xs mt-1">
          فقط حروف انگلیسی، اعداد و خط‌تیره مجاز است
        </p>
      </div>

      <!-- Description -->
      <div class="sm:col-span-2">
        <AdminInput
          v-model="form.description"
          label="توضیحات (اختیاری)"
          placeholder="مثلاً: تخفیف ویژه تابستان" />
      </div>

      <!-- Type selector -->
      <div>
        <label class="field-label">
          نوع تخفیف <span class="text-error">*</span>
        </label>
        <div class="flex gap-2">
          <button
            v-for="opt in typeOptions" :key="opt.value"
            @click="form.type = opt.value"
            :class="[
              'flex-1 py-2.5 rounded-xl border-2 text-sm font-medium',
              'transition-all duration-150',
              form.type === opt.value
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-text-secondary hover:border-primary/40',
            ]">
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Value -->
      <div>
        <label class="field-label">
          مقدار تخفیف <span class="text-error">*</span>
        </label>
        <div :class="[
          'flex items-center border rounded-lg overflow-hidden transition-all',
          errors.value
            ? 'border-error ring-2 ring-error/15'
            : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15',
        ]">
          <input v-model.number="form.value"
            type="number" min="1"
            :max="form.type === 'percentage' ? 100 : undefined"
            dir="ltr"
            :placeholder="form.type === 'percentage' ? '20' : '500000'"
            class="flex-1 px-3 py-2.5 outline-none text-sm bg-card text-text-primary" />
          <span class="px-3 py-2.5 bg-surface border-r border-border
                       text-text-secondary text-sm flex-shrink-0 font-fanum">
            {{ form.type === 'percentage' ? '٪' : 'تومان' }}
          </span>
        </div>
        <p v-if="errors.value" class="field-error">{{ errors.value }}</p>
      </div>

      <!-- Max discount (percentage only) -->
      <div v-if="form.type === 'percentage'">
        <AdminInput
          v-model.number="form.maxDiscount"
          label="حداکثر مبلغ تخفیف (تومان، اختیاری)"
          type="number" min="0" dir="ltr"
          placeholder="مثلاً: 500000"
          hint="اگر خالی باشد، سقفی ندارد" />
      </div>

      <!-- Min order amount -->
      <div :class="form.type === 'percentage' ? '' : 'sm:col-span-1'">
        <AdminInput
          v-model.number="form.minOrderAmount"
          label="حداقل مبلغ سبد خرید (تومان)"
          type="number" min="0" dir="ltr"
          placeholder="مثلاً: 1000000"
          hint="اگر خالی باشد، محدودیتی ندارد" />
      </div>

      <!-- Usage limit -->
      <div>
        <AdminInput
          v-model.number="form.usageLimit"
          label="سقف تعداد استفاده"
          type="number" min="1" dir="ltr"
          placeholder="مثلاً: 100"
          hint="اگر خالی باشد، نامحدود است" />
      </div>

      <!-- Start date -->
      <div>
        <label class="field-label">تاریخ شروع (اختیاری)</label>
        <input v-model="form.startDate" type="date"
          class="field-input text-sm" dir="ltr" />
      </div>

      <!-- End date -->
      <div>
        <label class="field-label">تاریخ انقضا (اختیاری)</label>
        <input v-model="form.endDate" type="date"
          class="field-input text-sm" dir="ltr" />
        <p v-if="errors.endDate" class="field-error">{{ errors.endDate }}</p>
      </div>

      <!-- isActive toggle -->
      <div class="sm:col-span-2 flex items-center gap-3 pt-2">
        <div @click="form.isActive = !form.isActive"
          :class="[
            'relative w-11 h-6 rounded-full cursor-pointer',
            'transition-colors duration-200',
            form.isActive ? 'bg-success' : 'bg-gray-300',
          ]">
          <span :class="[
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow',
            'transition-transform duration-200',
            form.isActive ? 'translate-x-5 right-0.5' : 'right-0.5',
          ]" />
        </div>
        <span class="text-sm font-medium"
              :class="form.isActive ? 'text-success' : 'text-text-secondary'">
          {{ form.isActive ? 'کد تخفیف فعال است' : 'کد تخفیف غیرفعال است' }}
        </span>
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
import AdminModal  from '@/components/common/AdminModal.vue'
import AdminInput  from '@/components/common/AdminInput.vue'
import AdminButton from '@/components/common/AdminButton.vue'

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
  { value: 'percentage', label: 'درصدی (٪)' },
  { value: 'fixed',      label: 'مبلغ ثابت (تومان)' },
]

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
      code:           form.code.trim(),
      description:    form.description.trim() || undefined,
      type:           form.type,
      value:          Number(form.value),
      maxDiscount:    form.maxDiscount    ? Number(form.maxDiscount)    : null,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      usageLimit:     form.usageLimit     ? Number(form.usageLimit)     : null,
      startDate:      form.startDate || null,
      endDate:        form.endDate   || null,
      isActive:       form.isActive,
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
