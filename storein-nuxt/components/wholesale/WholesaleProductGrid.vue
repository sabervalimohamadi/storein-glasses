<template>
  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[67%] sm:max-w-none mx-auto sm:mx-0">
    <template v-if="loading">
      <WholesaleProductCard v-for="n in 8" :key="n" loading />
    </template>
    <template v-else-if="products.length">
      <WholesaleProductCard
        v-for="product in products"
        :key="product._id"
        :product="product"
      />
    </template>
    <div v-else class="col-span-full py-16 text-center" style="color: var(--color-text-secondary);">
      <div class="text-4xl mb-3">🏪</div>
      <p class="text-sm">محصول عمده‌ای یافت نشد</p>
    </div>
  </div>
</template>

<script setup>
import WholesaleProductCard from './WholesaleProductCard.vue'

defineProps({
  products: { type: Array,   default: () => [] },
  loading:  { type: Boolean, default: false },
})
</script>
