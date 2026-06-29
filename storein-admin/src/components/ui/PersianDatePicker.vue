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
    <div v-if="internalValue" class="date-value-display">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span dir="ltr">{{ formattedDisplay }}</span>
    </div>
    <p v-if="error" class="text-danger text-xs mt-1 text-right">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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

const _jalaliDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric', month: '2-digit', day: '2-digit',
})
const _time = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
  hour: '2-digit', minute: '2-digit', hour12: false,
})

const formattedDisplay = computed(() => {
  if (!internalValue.value) return ''
  try {
    const d = new Date(internalValue.value)
    if (isNaN(d.getTime())) return ''
    return `${_jalaliDate.format(d)}  |  ${_time.format(d)}`
  } catch { return '' }
})
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
/* input text color is handled globally in main.css */
</style>

<style scoped>
.date-value-display {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #2563eb;
  background: rgba(37,99,235,0.08);
  border: 1px solid rgba(37,99,235,0.2);
}
html.dark .date-value-display {
  color: #93C5FD;
  background: rgba(147,197,253,0.1);
  border-color: rgba(147,197,253,0.2);
}
</style>
