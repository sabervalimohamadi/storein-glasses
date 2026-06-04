<template>
  <AdminModal
    :modelValue="modelValue"
    :title="isEdit ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'"
    size="md"
    @close="close"
  >
    <div class="space-y-4">

      <AdminInput
        v-model="form.name"
        label="نام دسته‌بندی"
        placeholder="مثلاً: عینک آفتابی"
        required
        :error="errors.name"
      />

      <div v-if="isEdit">
        <label class="field-label">آدرس (Slug)</label>
        <input :value="form.slug" readonly dir="ltr"
          class="field-input bg-surface text-text-secondary cursor-not-allowed text-sm" />
      </div>

      <AdminSelect
        v-model="form.parentId"
        label="دسته والد"
        placeholder="— دسته اصلی (بدون والد) —"
        :options="parentOptions"
      />

      <AdminTextarea
        v-model="form.description"
        label="توضیحات"
        placeholder="توضیح کوتاهی درباره این دسته..."
        :rows="3"
      />

      <div>
        <label class="field-label">تصویر دسته‌بندی</label>
        <ImageUploader v-model="formImages" :max-images="1" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <AdminInput
          v-model.number="form.order"
          label="ترتیب نمایش"
          type="number"
          placeholder="0"
          hint="عدد کوچکتر = اول‌تر"
        />

        <div>
          <label class="field-label">وضعیت</label>
          <label class="flex items-center gap-3 mt-2 cursor-pointer">
            <div
              @click="form.isActive = !form.isActive"
              :class="[
                'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer',
                form.isActive ? 'bg-success' : 'bg-gray-300',
              ]"
            >
              <span :class="[
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                form.isActive ? 'right-0.5 translate-x-[-20px]' : 'right-0.5',
              ]" style="transform-origin: center;" />
            </div>
            <span class="text-sm font-medium" :class="form.isActive ? 'text-success' : 'text-text-secondary'">
              {{ form.isActive ? 'فعال' : 'غیرفعال' }}
            </span>
          </label>
        </div>
      </div>

    </div>

    <template #footer>
      <div class="flex gap-3">
        <AdminButton variant="ghost" class="flex-1" @click="close">انصراف</AdminButton>
        <AdminButton :loading="saving" class="flex-1" @click="submit">
          {{ isEdit ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی' }}
        </AdminButton>
      </div>
    </template>
  </AdminModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { categoryService } from '@/services/category.service'
import { useUiStore }      from '@/stores/ui.store'
import AdminModal    from '@/components/common/AdminModal.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminSelect   from '@/components/common/AdminSelect.vue'
import AdminTextarea from '@/components/common/AdminTextarea.vue'
import AdminButton   from '@/components/common/AdminButton.vue'
import ImageUploader from '@/views/products/components/ImageUploader.vue'

const props = defineProps({
  modelValue:    Boolean,
  category:      { type: Object, default: null },
  parentOptions: { type: Array,  default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'saved'])
const ui   = useUiStore()

const isEdit = computed(() => !!props.category)
const saving = ref(false)

const form = reactive({
  name:        '',
  slug:        '',
  parentId:    '',
  description: '',
  order:       0,
  isActive:    true,
})
const errors     = reactive({ name: '' })
const formImages = ref([])

watch(() => props.modelValue, (open) => {
  if (!open) return
  if (props.category) {
    form.name        = props.category.name        ?? ''
    form.slug        = props.category.slug        ?? ''
    form.parentId    = props.category.parentId    ?? ''
    form.description = props.category.description ?? ''
    form.order       = props.category.order       ?? 0
    form.isActive    = props.category.isActive    ?? true
    formImages.value = props.category.image ? [props.category.image] : []
  } else {
    form.name = form.slug = form.description = form.parentId = ''
    form.order    = 0
    form.isActive = true
    formImages.value = []
  }
  errors.name = ''
})

async function submit() {
  errors.name = ''
  if (!form.name.trim() || form.name.length < 2) {
    errors.name = 'نام دسته‌بندی حداقل ۲ کاراکتر باشد'
    return
  }
  saving.value = true
  try {
    const dto = {
      name:        form.name.trim(),
      parent:      form.parentId || undefined,
      description: form.description.trim() || undefined,
      image:       formImages.value[0]?.original?.url || undefined,
      sortOrder:   Number(form.order),
      isActive:    form.isActive,
    }
    let result
    if (isEdit.value) {
      const { data } = await categoryService.update(props.category._id, dto)
      result = data
      ui.addToast('دسته‌بندی ویرایش شد', 'success')
    } else {
      const { data } = await categoryService.create(dto)
      result = data
      ui.addToast('دسته‌بندی ایجاد شد', 'success')
    }
    emit('saved', result)
    close()
  } catch (err) {
    const msg = err.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ذخیره'), 'error')
  } finally {
    saving.value = false
  }
}

function close() { emit('update:modelValue', false) }
</script>
