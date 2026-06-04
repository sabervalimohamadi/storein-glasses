<template>
  <section class="rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, #0F3D73 0%, #1B4F8A 60%, #3B6FBE 100%);">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-5 pb-3 flex-wrap gap-3">
      <!-- Title -->
      <div class="flex items-center gap-2">
        <span class="text-2xl select-none">🔥</span>
        <h2 class="text-white font-black text-xl">فروش ویژه</h2>
      </div>

      <!-- Countdown -->
      <div class="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
        <span class="text-white/70 text-xs">تا پایان امروز:</span>
        <div class="flex items-center gap-1">
          <template v-for="(unit, index) in timerUnits" :key="unit.key">
            <div class="bg-white/20 rounded-lg min-w-[34px] py-1 text-center px-1.5">
              <span class="text-white font-black text-base tabular-nums leading-none font-fanum">{{ unit.value }}</span>
            </div>
            <span v-if="index < timerUnits.length - 1" class="text-white/70 font-bold text-sm">:</span>
          </template>
        </div>
      </div>

      <!-- See all -->
      <RouterLink
        to="/products?sort=discount"
        class="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors"
      >
        مشاهده همه
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 rtl:rotate-180">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
        </svg>
      </RouterLink>
    </div>

    <!-- Products -->
    <div class="flex gap-3 overflow-x-auto pb-5 px-4 scrollbar-hide">
      <!-- Skeleton -->
      <template v-if="loading">
        <div
          v-for="i in 5"
          :key="i"
          class="min-w-[180px] rounded-xl flex-shrink-0 overflow-hidden" style="background-color: var(--color-card);"
        >
          <BaseSkeleton height="140px" class="rounded-none" />
          <div class="p-3 space-y-2">
            <BaseSkeleton height="0.875rem" />
            <BaseSkeleton height="0.875rem" width="65%" />
            <BaseSkeleton height="1.75rem" class="mt-1" />
          </div>
        </div>
      </template>

      <!-- Real products -->
      <template v-else>
        <div
          v-for="product in products"
          :key="product._id"
          class="min-w-[180px] max-w-[180px] flex-shrink-0"
        >
          <BaseProductCard
            :product="product"
            :wishlist="wishlistStore.isInWishlist(product._id)"
            @add-to-cart="handleAddToCart(product)"
            @toggle-wish="wishlistStore.toggle(product._id)"
          />
        </div>
        <div v-if="products.length === 0" class="w-full text-center py-10 text-white/60 text-sm">
          محصولی برای فروش ویژه یافت نشد
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { productService } from '@/services/product.service'
import { useCartStore }    from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useUiStore }      from '@/stores/ui.store'
import BaseProductCard from '@/components/common/BaseProductCard.vue'
import BaseSkeleton    from '@/components/common/BaseSkeleton.vue'

const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()

// ── Products ─────────────────────────────────────────
const products = ref([])
const loading  = ref(true)

// ── Countdown ─────────────────────────────────────────
const timeLeft = ref({ hours: 0, minutes: 0, seconds: 0 })
let timerInterval = null

const endOfDay = () => {
  const d = new Date()
  d.setHours(23, 59, 59, 0)
  return d.getTime()
}

function updateTimer() {
  const diff = endOfDay() - Date.now()
  if (diff <= 0) {
    timeLeft.value = { hours: 0, minutes: 0, seconds: 0 }
    return
  }
  timeLeft.value = {
    hours:   Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

const timerUnits = computed(() => [
  { key: 'hours',   value: String(timeLeft.value.hours).padStart(2, '0') },
  { key: 'minutes', value: String(timeLeft.value.minutes).padStart(2, '0') },
  { key: 'seconds', value: String(timeLeft.value.seconds).padStart(2, '0') },
])

// ── Cart ──────────────────────────────────────────────
async function handleAddToCart(product) {
  try {
    await cartStore.addItem(product._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد', 'success')
  } catch {
    ui.addToast('خطا در افزودن به سبد خرید', 'error')
  }
}

// ── Lifecycle ─────────────────────────────────────────
onMounted(async () => {
  updateTimer()
  timerInterval = setInterval(updateTimer, 1000)

  try {
    const { data } = await productService.getAll({
      sort: 'discount',
      inStock: true,
      limit: 10,
      status: 'active',
    })
    products.value = data?.products ?? data?.items ?? []
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>
