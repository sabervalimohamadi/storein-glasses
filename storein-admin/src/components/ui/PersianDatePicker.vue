<template>
  <div class="persian-date-wrapper">
    <label v-if="label" class="block text-xs font-semibold text-text-secondary mb-1.5 text-right">
      {{ label }}
      <span v-if="required" class="text-danger mr-0.5">*</span>
    </label>
    <DatePicker
      v-model="internalValue"
      format="YYYY-MM-DDTHH:mm:ss.000Z"
      display-format="jYYYY/jMM/jDD HH:mm"
      type="datetime"
      locale="fa"
      :min="minDate"
      :clearable="clearable"
      :placeholder="placeholder || 'انتخاب تاریخ'"
      :auto-submit="true"
      :input-class="'field-input text-sm w-full h-9 px-3 rounded-lg'"
      @change="onDateChange"
    />
    <p v-if="error" class="text-danger text-xs mt-1 text-right">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: null },
  label:      { type: String, default: '' },
  placeholder: { type: String, default: '' },
  required:   { type: Boolean, default: false },
  clearable:  { type: Boolean, default: true },
  minDate:    { type: String, default: '' },
  error:      { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const internalValue = ref(props.modelValue ?? null)

watch(() => props.modelValue, (val) => { internalValue.value = val ?? null })

function onDateChange(val) {
  emit('update:modelValue', val || null)
}
</script>
