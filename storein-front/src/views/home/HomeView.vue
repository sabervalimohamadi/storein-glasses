<template>
  <div class="pb-4">

    <!-- ① Hero Banner — full width, outside container -->
    <HeroBanner />

    <div class="container-main">

      <!-- ② Category Bar -->
      <CategoryBar />

      <!-- ③ Flash Sale -->
      <FlashSale class="mb-6" />

      <!-- ④ New Arrivals -->
      <ProductRow
        title="جدیدترین عینک‌ها"
        link="/products?sort=newest"
        :products="newArrivals"
        :loading="loadingNew"
        class="mb-6"
      />

      <!-- ⑤ Special Banners -->
      <SpecialBanner class="mb-6" />

      <!-- ⑥ Bestsellers -->
      <ProductRow
        title="پرفروش‌ترین‌ها"
        link="/products?sort=bestseller"
        :products="bestsellers"
        :loading="loadingBest"
        class="mb-6"
      />

      <!-- ⑦ Sunglasses Row -->
      <ProductRow
        title="عینک‌های آفتابی"
        link="/category/sunglasses"
        :products="sunglasses"
        :loading="loadingSun"
        class="mb-6"
      />

      <!-- ⑧ Trust Strip -->
      <TrustStrip />

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { productService }   from '@/services/product.service'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useUiStore }       from '@/stores/ui.store'

import HeroBanner    from './components/HeroBanner.vue'
import CategoryBar   from './components/CategoryBar.vue'
import FlashSale     from './components/FlashSale.vue'
import ProductRow    from './components/ProductRow.vue'
import SpecialBanner from './components/SpecialBanner.vue'
import TrustStrip    from './components/TrustStrip.vue'

const wishlistStore = useWishlistStore()
const ui            = useUiStore()

// ── State ────────────────────────────────────────────
const newArrivals = ref([])
const bestsellers = ref([])
const sunglasses  = ref([])

const loadingNew  = ref(true)
const loadingBest = ref(true)
const loadingSun  = ref(true)

// ── Helpers ──────────────────────────────────────────
async function fetchSection(params, target, loadingRef) {
  loadingRef.value = true
  try {
    const { data } = await productService.getAll({ status: 'active', limit: 8, ...params })
    target.value = data?.products ?? data?.items ?? []
  } catch {
    ui.addToast('خطا در بارگذاری محصولات', 'error')
    target.value = []
  } finally {
    loadingRef.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────
onMounted(() => {
  Promise.allSettled([
    fetchSection({ sort: 'newest' },                           newArrivals, loadingNew),
    fetchSection({ sort: 'bestseller' },                       bestsellers, loadingBest),
    fetchSection({ sort: 'newest', category: 'sunglasses' },  sunglasses,  loadingSun),
    wishlistStore.fetchWishlist(),
  ])
})
</script>
