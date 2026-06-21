<template>
  <form @submit.prevent="submit" class="space-y-4">

    <div>
      <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">
        نام شرکت / فروشگاه <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.companyName"
        type="text"
        placeholder="مثال: عینک‌فروشی نوری"
        required
        minlength="2"
        class="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
        style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text-primary);"
      />
    </div>

    <div>
      <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">
        کد ملی / شناسه ملی <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.nationalId"
        type="text"
        placeholder="۱۰ رقم"
        required
        minlength="10"
        maxlength="11"
        class="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors font-fanum"
        style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text-primary);"
      />
    </div>

    <div>
      <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">
        توضیحات (اختیاری)
      </label>
      <textarea
        v-model="form.description"
        placeholder="درباره کسب‌وکار خود توضیح دهید..."
        rows="3"
        class="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors resize-none"
        style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text-primary);"
      />
    </div>

    <button
      type="submit"
      :disabled="loading"
      class="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-60"
    >
      {{ loading ? 'در حال ارسال...' : 'ثبت درخواست عمده‌فروشی' }}
    </button>

  </form>
</template>

<script setup>
import http from '~/services/http.service'
import { useUiStore } from '~/stores/ui.store'

const emit    = defineEmits(['submitted'])
const ui      = useUiStore()
const loading = ref(false)

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
