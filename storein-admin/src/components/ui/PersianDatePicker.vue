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

<style>
.vpd-icon-btn { display: none !important; }
.vpd-input-group { display: block !important; position: relative; }
.vpd-clear-btn { left: 8px; top: 50%; transform: translateY(-50%); line-height: 1; width: 20px; opacity: 0.5; }
.vpd-clear-btn:hover { opacity: 1; }

html.dark .vpd-content {
  background-color: #1E293B !important;
  color: #F1F5F9 !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
}
html.dark .vpd-week { color: #64748B !important; }
html.dark .vpd-day-text { color: #CBD5E1 !important; }
html.dark .vpd-month-label { color: #F1F5F9 !important; }
html.dark .vpd-arrow { stroke: #F1F5F9 !important; fill: #F1F5F9 !important; }
html.dark .vpd-prev svg path,
html.dark .vpd-next svg path { stroke: #F1F5F9 !important; }
html.dark .vpd-year-label { color: rgba(255,255,255,0.75) !important; }
html.dark .vpd-addon-list {
  background-color: #1E293B !important;
  border-color: #334155 !important;
}
html.dark .vpd-addon-list-item {
  color: #94A3B8 !important;
  border-color: #1E293B !important;
}
html.dark .vpd-addon-list-item:hover {
  background-color: rgba(255,255,255,0.06) !important;
  color: #F1F5F9 !important;
}
html.dark .vpd-selected.vpd-addon-list-item {
  background-color: rgba(27,79,138,0.3) !important;
  color: #93C5FD !important;
}
html.dark .vpd-close-addon {
  color: #F1F5F9 !important;
  background-color: rgba(255,255,255,0.1) !important;
}
html.dark .vpd-actions button,
html.dark .vpd-actions a { color: #60A5FA !important; }
html.dark .vpd-column-header { color: #F1F5F9 !important; }
html.dark .vpd-range-between { background-color: rgba(255,255,255,0.06) !important; }
html.dark .vpd-day:not(.vpd-selected):hover .vpd-day-effect {
  background-color: rgba(255,255,255,0.06) !important;
  opacity: 1 !important;
  transform: scale(1) !important;
}
html.dark .vpd-controls { color: #F1F5F9 !important; }
html.dark .vpd-header { background-color: #1B4F8A !important; }
html.dark .vpd-time .vpd-time-hour,
html.dark .vpd-time .vpd-time-minute { color: #F1F5F9 !important; }
html.dark .vpd-time-separator { color: #94A3B8 !important; }
html.dark .vpd-input-group input {
  background-color: var(--color-surface, #1E293B) !important;
  color: #F1F5F9 !important;
  border-color: var(--color-border, #334155) !important;
}
</style>
