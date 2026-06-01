<template>
  <section class="py-2">
    <!-- Row header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-text-primary flex items-center gap-2">
        <span class="w-1 h-5 bg-brand rounded-full inline-block"></span>
        {{ title }}
      </h2>
      <RouterLink
        :to="link"
        class="text-brand text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all duration-200"
      >
        مشاهده همه
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 rtl:rotate-180">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
        </svg>
      </RouterLink>
    </div>

    <!-- Scrollable row + arrows -->
    <div class="relative group">
      <!-- Right arrow (scroll toward start in RTL) -->
      <button
        class="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 bg-white shadow-dropdown rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:!opacity-0"
        :disabled="atStart"
        @click="scrollToStart"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-text-primary">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
        </svg>
      </button>

      <!-- Scrollable container -->
      <div
        ref="scrollEl"
        class="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        @scroll="onScroll"
      >
        <!-- Skeleton state -->
        <template v-if="loading">
          <div
            v-for="i in skeletonCount"
            :key="i"
            class="min-w-[200px] max-w-[200px] bg-white rounded-xl flex-shrink-0 overflow-hidden"
          >
            <BaseSkeleton height="160px" class="rounded-none" />
            <div class="p-3 space-y-2">
              <BaseSkeleton height="0.875rem" />
              <BaseSkeleton height="0.875rem" width="60%" />
              <BaseSkeleton height="0.75rem" width="40%" />
              <BaseSkeleton height="2rem" class="mt-1" />
            </div>
          </div>
        </template>

        <!-- Real products -->
        <template v-else>
          <div
            v-for="product in products"
            :key="product._id"
            class="min-w-[200px] max-w-[200px] flex-shrink-0"
          >
            <BaseProductCard
              :product="product"
              :wishlist="wishlistStore.isInWishlist(product._id)"
              @add-to-cart="handleAddToCart(product)"
              @toggle-wish="wishlistStore.toggle(product._id)"
            />
          </div>
          <BaseEmpty
            v-if="products.length === 0"
            title="محصولی یافت نشد"
            icon="👓"
            class="min-w-full"
          />
        </template>
      </div>

      <!-- Left arrow (scroll toward end in RTL) -->
      <button
        class="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 bg-white shadow-dropdown rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:!opacity-0"
        :disabled="atEnd"
        @click="scrollToEnd"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-text-primary">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
        </svg>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useUiStore } from '@/stores/ui.store'
import BaseProductCard from '@/components/common/BaseProductCard.vue'
import BaseSkeleton    from '@/components/common/BaseSkeleton.vue'
import BaseEmpty       from '@/components/common/BaseEmpty.vue'

const props = defineProps({
  title:         { type: String, required: true },
  link:          { type: String, default: '/products' },
  products:      { type: Array,  default: () => [] },
  loading:       { type: Boolean, default: false },
  skeletonCount: { type: Number, default: 5 },
})

const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()

const scrollEl = ref(null)
const atStart  = ref(true)
const atEnd    = ref(false)

function getAbsScrollLeft(el) {
  // RTL: Chrome gives negative scrollLeft, Firefox gives positive decreasing to 0
  return Math.abs(el.scrollLeft)
}

function onScroll() {
  const el = scrollEl.value
  if (!el) return
  const abs      = getAbsScrollLeft(el)
  const maxScroll = el.scrollWidth - el.clientWidth
  atStart.value = abs <= 10
  atEnd.value   = abs >= maxScroll - 10
}

function scrollToStart() {
  // In RTL, positive scrollBy.left moves toward start (right side)
  scrollEl.value?.scrollBy({ left: 600, behavior: 'smooth' })
}

function scrollToEnd() {
  // In RTL, negative scrollBy.left moves toward end (left side)
  scrollEl.value?.scrollBy({ left: -600, behavior: 'smooth' })
}

async function handleAddToCart(product) {
  try {
    await cartStore.addItem(product._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد', 'success')
  } catch {
    ui.addToast('خطا در افزودن به سبد خرید', 'error')
  }
}

onMounted(() => {
  onScroll()
})
</script>
