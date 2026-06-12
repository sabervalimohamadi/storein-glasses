<template>
  <div>
    <label v-if="label" class="field-label">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>
    <DatePicker
      v-model="internalValue"
      :placeholder="placeholder || 'انتخاب تاریخ'"
      :clearable="clearable"
      :min="min"
      :max="max"
      :disabled="disabled"
      format="YYYY-MM-DD"
      display-format="jYYYY/jMM/jDD"
      :input-class="inputClass"
      :color="'#1B4F8A'"
      :auto-submit="true"
    />
    <p v-if="error" class="field-error mt-1">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DatePicker from 'vue3-persian-datetime-picker'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label:      { type: String, default: '' },
  placeholder:{ type: String, default: '' },
  required:   { type: Boolean, default: false },
  clearable:  { type: Boolean, default: true },
  disabled:   { type: Boolean, default: false },
  min:        { type: String, default: '' },
  max:        { type: String, default: '' },
  error:      { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const internalValue = computed({
  get: () => props.modelValue ?? '',
  set: (val) => emit('update:modelValue', val ?? ''),
})

const inputClass = computed(() =>
  ['field-input w-full', props.error ? 'border-error' : ''].filter(Boolean).join(' ')
)
</script>

<style>
/* hide calendar icon button — clicking the input opens the picker */
.vpd-icon-btn { display: none !important; }
/* make the input group block so it takes full width */
.vpd-input-group { display: block !important; position: relative; }
/* clear button positioning */
.vpd-clear-btn { left: 8px; top: 50%; transform: translateY(-50%); line-height: 1; width: 20px; opacity: 0.5; }
.vpd-clear-btn:hover { opacity: 1; }

/* ── Dark mode overrides ── */
html.dark .vpd-content {
  background-color: #1E293B !important;
  color: #F1F5F9 !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
}

/* weekday labels (ش ی د ...) */
html.dark .vpd-week { color: #64748B !important; }

/* day numbers */
html.dark .vpd-day-text { color: #CBD5E1 !important; }

/* navigation month label */
html.dark .vpd-month-label { color: #F1F5F9 !important; }

/* navigation arrows */
html.dark .vpd-arrow { stroke: #F1F5F9 !important; fill: #F1F5F9 !important; }
html.dark .vpd-prev svg path,
html.dark .vpd-next svg path { stroke: #F1F5F9 !important; }

/* year label in header */
html.dark .vpd-year-label { color: rgba(255,255,255,0.75) !important; }

/* month/year addon list (dropdown) */
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

/* close X button in addon list */
html.dark .vpd-close-addon {
  color: #F1F5F9 !important;
  background-color: rgba(255,255,255,0.1) !important;
}

/* Clear / Today action buttons */
html.dark .vpd-actions button,
html.dark .vpd-actions a {
  color: #60A5FA !important;
}

/* column header in simple mode */
html.dark .vpd-column-header { color: #F1F5F9 !important; }

/* range between */
html.dark .vpd-range-between { background-color: rgba(255,255,255,0.06) !important; }

/* day hover */
html.dark .vpd-day:not(.vpd-selected):hover .vpd-day-effect {
  background-color: rgba(255,255,255,0.06) !important;
  opacity: 1 !important;
  transform: scale(1) !important;
}

/* controls bg */
html.dark .vpd-controls { color: #F1F5F9 !important; }
</style>
