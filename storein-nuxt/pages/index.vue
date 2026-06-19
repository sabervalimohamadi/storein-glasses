<template>
  <div class="home">
    <HeroBanner />
    <div class="container-main">
      <CategoryBar />
      <FlashSale class="home__section" />
      <ProductRow
        title="جدیدترین عینک‌ها"
        link="/products?sort=newest"
        :products="newArrivals"
        :loading="loadingNew"
        class="home__section"
      />
      <SpecialBanner class="home__section" />
      <ProductRow
        featured
        title="پرفروش‌ترین‌ها"
        link="/products?sort=bestseller"
        :products="bestsellers"
        :loading="loadingBest"
        class="home__section"
      />
      <ProductRow
        title="عینک‌های آفتابی"
        link="/category/sunglasses"
        :products="sunglasses"
        :loading="loadingSun"
        class="home__section"
      />
      <MostViewed class="home__section" />
      <TrustStrip class="home__section" />
    </div>
  </div>
</template>

<script setup>
import HeroBanner    from '~/components/home/HeroBanner.vue'
import CategoryBar   from '~/components/home/CategoryBar.vue'
import FlashSale     from '~/components/home/FlashSale.vue'
import ProductRow    from '~/components/home/ProductRow.vue'
import SpecialBanner from '~/components/home/SpecialBanner.vue'
import MostViewed    from '~/components/home/MostViewed.vue'
import TrustStrip    from '~/components/home/TrustStrip.vue'
import { productService } from '~/services/product.service'

definePageMeta({ layout: 'default' })

const config        = useRuntimeConfig()
const settingsStore = useSettingsStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()

useSeoMeta({
  title:       () => settingsStore.tagline,
  description: () => settingsStore.description,
  ogType:      'website',
  ogUrl:       `${config.public.siteUrl}/`,
})
useHead({ link: [{ rel: 'canonical', href: `${config.public.siteUrl}/` }] })

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
    target.value = []
  } finally {
    loadingRef.value = false
  }
}

onMounted(() => {
  Promise.allSettled([
    fetchSection({ sort: 'newest' },                            newArrivals, loadingNew),
    fetchSection({ sort: 'bestseller' },                        bestsellers, loadingBest),
    fetchSection({ sort: 'newest', category: 'eynak-aftabi' }, sunglasses,  loadingSun),
    wishlistStore.fetchWishlist(),
  ])
})
</script>

<style scoped>
.home { padding-bottom: 2rem; }
.home__section { margin-bottom: 1.75rem; }
</style>
