<template>
  <!-- Skeleton -->
  <div v-if="loading" class="bg-white rounded-xl shadow-card overflow-hidden">
    <BaseSkeleton height="200px" class="rounded-none" />
    <div class="p-3 space-y-2">
      <BaseSkeleton height="1rem" />
      <BaseSkeleton height="1rem" width="70%" />
      <BaseSkeleton height="0.75rem" width="45%" />
      <BaseSkeleton height="2.25rem" class="mt-2" />
    </div>
  </div>

  <!-- Product card -->
  <article
    v-else
    class="bg-white rounded-xl shadow-card overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
    @click="handleClick"
  >
    <!-- Image -->
    <div class="aspect-square relative bg-gray-50 p-3 shrink-0">
      <!-- Heart: always visible, filled if in wishlist -->
      <button
        type="button"
        :class="[
          'absolute top-2 end-2 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200',
          wishlist ? 'bg-red-50 opacity-100' : 'bg-white/80 opacity-0 group-hover:opacity-100 shadow-sm',
        ]"
        @click.stop="$emit('toggle-wish')"
        :title="wishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          :fill="wishlist ? 'currentColor' : 'none'"
          stroke="currentColor" stroke-width="1.5"
          :class="['w-4 h-4', wishlist ? 'text-red-500' : 'text-gray-500']"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
        </svg>
      </button>

      <!-- Discount + New badges: top-start (right in RTL) -->
      <div class="absolute top-2 start-2 z-10 flex flex-col gap-1">
        <BaseBadge v-if="discount > 0" variant="red" size="sm">{{ discount }}%</BaseBadge>
        <BaseBadge v-if="product.isNew" variant="navy" size="sm">جدید</BaseBadge>
      </div>

      <img
        :src="imgSrc"
        :alt="product.name"
        class="w-full h-full object-contain"
        loading="lazy"
        @error="imgSrc = placeholder"
      />

      <!-- Out of stock overlay -->
      <div v-if="!product.inStock" class="absolute inset-0 bg-white/75 flex items-center justify-center">
        <span class="text-text-secondary font-semibold text-sm px-3 py-1 bg-white rounded-full shadow-sm">ناموجود</span>
      </div>
    </div>

    <!-- Body -->
    <div class="p-3 flex flex-col gap-1.5 flex-1">
      <h3 class="text-sm font-medium text-text-primary line-clamp-2 leading-relaxed" style="min-height: 2.5rem">
        {{ product.name }}
      </h3>

      <BaseRating
        v-if="product.avgRating"
        :model-value="product.avgRating"
        :count="product.reviewCount"
        readonly
        size="sm"
        show-value
      />

      <!-- Price block -->
      <div class="mt-auto pt-1">
        <div v-if="discount > 0" class="flex items-center gap-2 mb-0.5">
          <span class="text-xs text-text-secondary line-through">{{ formatPrice(product.comparePrice) }}</span>
          <BaseBadge variant="red" size="sm">{{ discount }}%</BaseBadge>
        </div>
        <span class="text-base font-bold text-text-primary">{{ formatPrice(product.minPrice) }}</span>
      </div>

      <BaseButton
        block
        size="sm"
        class="mt-2"
        :disabled="!product.inStock"
        @click.stop="$emit('add-to-cart')"
      >
        + افزودن به سبد
      </BaseButton>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseSkeleton from './BaseSkeleton.vue'
import BaseBadge    from './BaseBadge.vue'
import BaseRating   from './BaseRating.vue'
import BaseButton   from './BaseButton.vue'
import { formatPrice } from '@/utils/formatters'
import { PRODUCT_PLACEHOLDER } from '@/utils/constants'

const props = defineProps({
  product: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  wishlist: { type: Boolean, default: false },
})

defineEmits(['click', 'add-to-cart', 'toggle-wish'])

const router = useRouter()

const placeholder = PRODUCT_PLACEHOLDER

const imgSrc = ref(
  props.product.images?.[0]?.thumbnail ||
  props.product.images?.[0]?.url ||
  PRODUCT_PLACEHOLDER
)

const discount = computed(() => {
  const { minPrice, comparePrice } = props.product
  if (comparePrice && comparePrice > minPrice && minPrice > 0) {
    return Math.round((1 - minPrice / comparePrice) * 100)
  }
  return 0
})

function handleClick() {
  router.push({ name: 'product-detail', params: { slug: props.product.slug } })
}
</script>
