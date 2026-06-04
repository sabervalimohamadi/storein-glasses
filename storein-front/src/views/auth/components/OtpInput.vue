<template>
  <div class="flex gap-2 justify-center" dir="ltr">
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="el => { if (el) inputs[index] = el }"
      v-model="digits[index]"
      type="text"
      inputmode="numeric"
      maxlength="1"
      :disabled="disabled"
      :class="[
        'w-12 h-14 text-center text-xl font-bold rounded-xl border-2',
        'transition-all duration-150 outline-none',
        'focus:border-brand focus:ring-2 focus:ring-brand/20',
        error
          ? 'border-error bg-red-50 text-error'
          : digit
            ? 'border-brand bg-brand/5 text-brand'
            : 'border-surface-border bg-surface-card text-text-primary',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @paste="onPaste"
      @focus="$event.target.select()"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String,  default: '' },
  length:     { type: Number,  default: 5  },
  disabled:   { type: Boolean, default: false },
  error:      { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'complete'])

const inputs = ref([])
const digits = ref(Array(props.length).fill(''))

// Sync digits when parent resets modelValue to ''
watch(() => props.modelValue, (val) => {
  if (val === '') digits.value = Array(props.length).fill('')
})

function onInput(index, event) {
  const raw = event.target.value.replace(/\D/g, '')
  digits.value[index] = raw ? raw[raw.length - 1] : ''
  emitValue()
  if (digits.value[index] && index < props.length - 1) {
    nextTick(() => inputs.value[index + 1]?.focus())
  }
}

function onKeydown(index, event) {
  if (event.key === 'Backspace') {
    if (digits.value[index]) {
      digits.value[index] = ''
      emitValue()
    } else if (index > 0) {
      digits.value[index - 1] = ''
      emitValue()
      nextTick(() => inputs.value[index - 1]?.focus())
    }
  } else if (event.key === 'ArrowRight' && index > 0) {
    nextTick(() => inputs.value[index - 1]?.focus())
  } else if (event.key === 'ArrowLeft' && index < props.length - 1) {
    nextTick(() => inputs.value[index + 1]?.focus())
  }
}

function onPaste(event) {
  event.preventDefault()
  const pasted = event.clipboardData
    .getData('text')
    .replace(/\D/g, '')
    .slice(0, props.length)
  pasted.split('').forEach((char, i) => {
    digits.value[i] = char
  })
  emitValue()
  const focusIndex = Math.min(pasted.length, props.length - 1)
  nextTick(() => inputs.value[focusIndex]?.focus())
}

function emitValue() {
  const joined = digits.value.join('')
  emit('update:modelValue', joined)
  if (joined.length === props.length) {
    emit('complete', joined)
  }
}

defineExpose({
  focus: () => nextTick(() => inputs.value[0]?.focus()),
})
</script>
