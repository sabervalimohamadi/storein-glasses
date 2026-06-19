<template>
  <div class="home">

    <!-- ① Hero Banner — full width, outside container -->
    <HeroBanner />

    <div class="container-main">

      <!-- ② Category Bar -->
      <CategoryBar />

      <!-- ③ Flash Sale -->
      <FlashSale class="home__section" />

      <!-- ④ New Arrivals -->
      <ProductRow
        title="جدیدترین عینک‌ها"
        link="/products?sort=newest"
        :products="newArrivals"
        :loading="loadingNew"
        class="home__section"
      />

      <!-- ⑤ Special Banners -->
      <SpecialBanner class="home__section" />

      <!-- ⑥ Bestsellers -->
      <ProductRow
        featured
        title="پرفروش‌ترین‌ها"
        link="/products?sort=bestseller"
        :products="bestsellers"
        :loading="loadingBest"
        class="home__section"
      />

      <!-- ⑦ Sunglasses Row -->
      <ProductRow
        title="عینک‌های آفتابی"
        link="/category/sunglasses"
        :products="sunglasses"
        :loading="loadingSun"
        class="home__section"
      />

      <!-- ⑧ Most Viewed -->
      <MostViewed class="home__section" />

      <!-- ⑨ Trust Strip -->
      <TrustStrip class="home__section" />

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { productService }   from '@/services/product.service'
import { useSeoHead } from '@/composables/useSeoHead'

useSeoHead({ canonicalPath: '/' })
import { useWishlistStore } from '@/stores/wishlist.store'
import { useUiStore }       from '@/stores/ui.store'

import HeroBanner    from './components/HeroBanner.vue'
import CategoryBar   from './components/CategoryBar.vue'
import FlashSale     from './components/FlashSale.vue'
import ProductRow    from './components/ProductRow.vue'
import SpecialBanner from './components/SpecialBanner.vue'
import MostViewed    from './components/MostViewed.vue'
import TrustStrip    from './components/TrustStrip.vue'

const wishlistStore = useWishlistStore()
const ui            = useUiStore()

const newArrivals = ref([])
const bestsellers = ref([])
const sunglasses  = ref([])

const loadingNew  = ref(true)
const loadingBest = ref(true)
const loadingSun  = ref(true)

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

onMounted(() => {
  Promise.allSettled([
    fetchSection({ sort: 'newest' },                           newArrivals, loadingNew),
    fetchSection({ sort: 'bestseller' },                       bestsellers, loadingBest),
    fetchSection({ sort: 'newest', category: 'eynak-aftabi' }, sunglasses,  loadingSun),
    wishlistStore.fetchWishlist(),
  ])
})
</script>

<style scoped>
.home {
  padding-bottom: 2rem;
}
.home__section {
  margin-bottom: 1.75rem;
}
</style>
