<template>
  <form @submit.prevent="submit" class="space-y-5">

    <!-- Company name -->
    <div>
      <label class="form-label">
        <span>نام شرکت / فروشگاه</span>
        <span class="text-red-500 mr-0.5">*</span>
      </label>
      <div class="input-wrap" :class="{ 'input-wrap--focus': focused === 'company' }">
        <span class="input-icon">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm0 4h2v2H7V9zm0 4h2v2H7v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clip-rule="evenodd"/></svg>
        </span>
        <input
          v-model="form.companyName"
          type="text"
          placeholder="مثال: عینک‌فروشی نوری"
          required
          minlength="2"
          class="form-input"
          @focus="focused = 'company'"
          @blur="focused = null"
        />
      </div>
    </div>

    <!-- National ID -->
    <div>
      <label class="form-label">
        <span>کد ملی / شناسه ملی</span>
        <span class="text-red-500 mr-0.5">*</span>
      </label>
      <div class="input-wrap" :class="{ 'input-wrap--focus': focused === 'nid' }">
        <span class="input-icon">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
        </span>
        <input
          v-model="form.nationalId"
          type="text"
          placeholder="۱۰ رقم"
          required
          minlength="10"
          maxlength="11"
          class="form-input font-fanum"
          @focus="focused = 'nid'"
          @blur="focused = null"
        />
      </div>
      <p class="field-hint">کد ملی برای اشخاص حقیقی / شناسه ملی برای اشخاص حقوقی</p>
    </div>

    <!-- Description -->
    <div>
      <label class="form-label">
        <span>توضیحات کسب‌وکار</span>
        <span style="font-size:11px; font-weight:400; margin-right:4px; opacity:0.6;">(اختیاری)</span>
      </label>
      <div class="input-wrap input-wrap--textarea" :class="{ 'input-wrap--focus': focused === 'desc' }">
        <span class="input-icon input-icon--top">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd"/></svg>
        </span>
        <textarea
          v-model="form.description"
          placeholder="نوع کسب‌وکار، تجربه در صنعت عینک، حجم سفارش تخمینی..."
          rows="3"
          class="form-input form-input--textarea"
          @focus="focused = 'desc'"
          @blur="focused = null"
        />
      </div>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="loading"
      class="submit-btn"
      :class="{ 'submit-btn--loading': loading }"
    >
      <span v-if="loading" class="btn-spinner" />
      <span v-else class="flex items-center justify-center gap-2">
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
        </svg>
        ثبت درخواست عمده‌فروشی
      </span>
    </button>

  </form>
</template>

<script setup>
import http from '~/services/http.service'
import { useUiStore } from '~/stores/ui.store'

const emit    = defineEmits(['submitted'])
const ui      = useUiStore()
const loading = ref(false)
const focused = ref(null)

const form = reactive({
  companyName: '',
  nationalId:  '',
  description: '',
})

async function submit() {
  loading.value = true
  try {
    await http.post('/users/me/wholesale-request', form)
    ui.addToast('درخواست شما با موفقیت ثبت شد', 'success')
    emit('submitted')
  } catch (e) {
    ui.addToast(e?.response?.data?.message || 'خطا در ثبت درخواست', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 7px;
}

.input-wrap {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  overflow: hidden;
}
.input-wrap--textarea { align-items: flex-start; }
.input-wrap--focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
  opacity: 0.5;
}
.input-icon svg { width: 17px; height: 17px; }
.input-icon--top { padding-top: 13px; align-items: flex-start; }

.form-input {
  flex: 1;
  padding: 12px 4px 12px 12px;
  font-size: 14px;
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
}
.form-input::placeholder { color: var(--color-text-secondary); opacity: 0.45; }
.form-input--textarea { resize: none; padding-top: 12px; line-height: 1.6; }

.field-hint {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 5px;
  padding-right: 4px;
  opacity: 0.7;
}

.submit-btn {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border: none;
  cursor: pointer;
  transition: opacity 0.18s, transform 0.12s, box-shadow 0.18s;
  box-shadow: 0 4px 20px rgba(109,40,217,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(109,40,217,0.45);
}
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-spinner {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
