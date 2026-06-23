<template>
  <div class="min-h-screen flex items-center justify-center bg-surface px-4">
    <div class="text-center">
      <div class="text-6xl mb-4" aria-hidden="true">{{ error.statusCode === 404 ? '🔍' : '⚠️' }}</div>
      <h1 class="text-2xl font-black text-text-primary mb-2">
        {{ error.statusCode === 404 ? 'صفحه یافت نشد' : 'خطایی رخ داد' }}
      </h1>
      <p class="text-text-secondary mb-6">{{ error.message || 'لطفاً دوباره تلاش کنید' }}</p>
      <NuxtLink to="/" class="btn-brand inline-block px-6 py-3">
        بازگشت به صفحه اصلی
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ error: Object })
useSeoMeta({
  title: props.error?.statusCode === 404 ? 'صفحه یافت نشد' : 'خطا',
  robots: 'noindex,nofollow',
})
</script>
