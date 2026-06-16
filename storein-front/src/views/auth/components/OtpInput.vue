<template>
  <!-- CSS grid: each box gets 1fr — physically cannot overflow the container -->
  <div
    class="grid w-full"
    :style="`grid-template-columns: repeat(${length}, 1fr); gap: 10px;`"
    dir="ltr"
    data-testid="otp-grid"
  >
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="el => { if (el) inputs[index] = el }"
      v-model="digits[index]"
      type="text"
      inputmode="numeric"
      maxlength="1"
      :disabled="disabled"
      :data-testid="`otp-cell-${index}`"
      :class="[
        'w-full h-12 text-center text-xl font-bold rounded-xl border-2 min-w-0',
        'transition-all duration-200 outline-none caret-transparent',
        error
          ? 'border-error text-error'
          : digit
            ? 'border-brand text-brand'
            : 'border-surface-border text-text-primary',
        !error && digit ? 'bg-brand/10' : '',
        error ? 'bg-error/5' : '',
        !digit && !error ? '' : '',
        'focus:border-brand focus:ring-2 focus:ring-brand/20 focus:scale-[1.06]',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
      :style="!digit && !error ? 'background-color: var(--color-bg);' : ''"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @paste="onPaste"
      @focus="$event.target.select()"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { logger } from '@/utils/logger'

const CTX = 'OtpInput'

const props = defineProps({
  modelValue: { type: String,  default: '' },
  length:     { type: Number,  default: 6  },
  disabled:   { type: Boolean, default: false },
  error:      { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'complete'])

const inputs = ref([])
const digits = ref(Array(props.length).fill(''))

watch(() => props.modelValue, (val) => {
  if (val === '') {
    digits.value = Array(props.length).fill('')
    logger.debug('OTP input: cleared by parent', {}, CTX)
  }
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
  pasted.split('').forEach((char, i) => { digits.value[i] = char })
  emitValue()
  const focusIndex = Math.min(pasted.length, props.length - 1)
  logger.debug('OTP input: pasted digits', { count: pasted.length }, CTX)
  nextTick(() => inputs.value[focusIndex]?.focus())
}

function emitValue() {
  const joined = digits.value.join('')
  emit('update:modelValue', joined)
  if (joined.length === props.length) {
    logger.debug('OTP input: all digits entered', { length: props.length }, CTX)
    emit('complete', joined)
  }
}

defineExpose({
  focus: () => nextTick(() => inputs.value[0]?.focus()),
})
</script>
