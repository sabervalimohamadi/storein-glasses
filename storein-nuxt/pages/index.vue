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
      <LatestBlogPosts class="home__section" />
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
const MostViewed      = defineAsyncComponent(() => import('~/components/home/MostViewed.vue'))
const LatestBlogPosts = defineAsyncComponent(() => import('~/components/home/LatestBlogPosts.vue'))
const TrustStrip      = defineAsyncComponent(() => import('~/components/home/TrustStrip.vue'))

definePageMeta({ layout: 'default' })

const config        = useRuntimeConfig()
const settingsStore = useSettingsStore()
const wishlistStore = useWishlistStore()

useSeoMeta({
  title:       () => settingsStore.tagline,
  description: () => settingsStore.description,
  ogType:      'website',
  ogUrl:       `${config.public.siteUrl}/`,
})
useHead({ link: [{ rel: 'canonical', href: `${config.public.siteUrl}/` }] })

// ── SSR Data Fetch — Google sees real product content ───────────
const [
  { data: rawNew,  pending: loadingNew },
  { data: rawBest, pending: loadingBest },
  { data: rawSun,  pending: loadingSun },
] = await Promise.all([
  useAsyncData('home-new',  () => $fetch('/api/v1/products', { params: { status: 'active', limit: 8, sort: 'newest' } }),                           { transform: (r) => r?.data ?? r }),
  useAsyncData('home-best', () => $fetch('/api/v1/products', { params: { status: 'active', limit: 8, sort: 'bestseller' } }),                       { transform: (r) => r?.data ?? r, lazy: true }),
  useAsyncData('home-sun',  () => $fetch('/api/v1/products', { params: { status: 'active', limit: 8, sort: 'newest', category: 'eynak-aftabi' } }), { transform: (r) => r?.data ?? r, lazy: true }),
])

const newArrivals = computed(() => rawNew.value?.products  ?? rawNew.value?.items  ?? [])
const bestsellers = computed(() => rawBest.value?.products ?? rawBest.value?.items ?? [])
const sunglasses  = computed(() => rawSun.value?.products  ?? rawSun.value?.items  ?? [])

// ItemList JSON-LD for bestsellers
useHead({
  script: computed(() => {
    const items = bestsellers.value
    if (!items?.length) return []
    return [{
      type: 'application/ld+json', key: 'jsonld-itemlist',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: 'پرفروش‌ترین محصولات', url: `${config.public.siteUrl}/`,
        itemListElement: items.map((p, i) => ({
          '@type': 'ListItem', position: i + 1,
          url: `${config.public.siteUrl}/product/${p.slug}`, name: p.name,
        })),
      }),
    }]
  }),
})

onMounted(() => { wishlistStore.fetchWishlist() })
</script>

<style scoped>
.home { padding-bottom: 2rem; }
.home__section { margin-bottom: 1.75rem; }
@media (min-width: 768px) {
  .home__section { margin-bottom: 3rem; }
}
</style>
