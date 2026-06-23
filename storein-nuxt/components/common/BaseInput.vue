<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="uid" class="text-sm font-medium text-text-primary">{{ label }}</label>
    <div class="relative flex items-center">
      <!-- Prepend slot: right side in RTL (reading start) -->
      <div
        v-if="$slots.prepend || prepend"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary pointer-events-none"
      >
        <slot name="prepend"><span>{{ prepend }}</span></slot>
      </div>
      <input
        v-bind="$attrs"
        :id="uid"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :dir="dir"
        :class="[
          'input-field',
          $slots.prepend || prepend ? 'pr-10' : '',
          $slots.append || append ? 'pl-10' : '',
          error ? '!border-error !ring-error/20' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
        @keydown.enter="$emit('enter', $event)"
      />
      <!-- Append slot: left side in RTL (reading end) -->
      <div
        v-if="$slots.append || append"
        class="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary pointer-events-none"
      >
        <slot name="append"><span>{{ append }}</span></slot>
      </div>
    </div>
    <p v-if="error" class="text-xs text-error">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-text-secondary">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue:  { type: [String, Number], default: '' },
  label:       { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type:        { type: String, default: 'text' },
  error:       { type: String, default: '' },
  hint:        { type: String, default: '' },
  disabled:    { type: Boolean, default: false },
  prepend:     { type: String, default: '' },
  append:      { type: String, default: '' },
  dir:         { type: String, default: 'rtl' },
})

defineEmits(['update:modelValue', 'focus', 'blur', 'enter'])

const uid = `input-${Math.random().toString(36).slice(2, 9)}`
</script>
