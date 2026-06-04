<template>
  <div class="container-main py-4 pb-24 md:pb-6">

    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-text-secondary mb-5 overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
      <RouterLink to="/" class="hover:text-brand flex-shrink-0">خانه</RouterLink>
      <svg class="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
      </svg>
      <RouterLink
        v-if="product?.category"
        :to="{ name: 'category', params: { slug: product.category.slug } }"
        class="hover:text-brand flex-shrink-0"
      >
        {{ product.category.name }}
      </RouterLink>
      <svg v-if="product?.category" class="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
      </svg>
      <span class="text-text-primary font-medium truncate">
        {{ product?.name || '...' }}
      </span>
    </nav>

    <!-- 404 state -->
    <div v-if="notFound" class="text-center py-20">
      <div class="text-6xl mb-4">🔍</div>
      <h1 class="text-xl font-bold text-text-primary mb-2">محصول یافت نشد</h1>
      <p class="text-text-secondary mb-6">این محصول وجود ندارد یا حذف شده است</p>
      <RouterLink to="/products">
        <BaseButton>مشاهده همه محصولات</BaseButton>
      </RouterLink>
    </div>

    <template v-else>

      <!-- ① Top: Gallery + Info -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProductGallery
          ref="galleryRef"
          :images="product?.images || []"
          :name="product?.name || ''"
          :loading="loading"
        />
        <ProductInfo
          ref="infoRef"
          :product="product"
          :loading="loading"
          @add-to-cart="onAddToCart"
          @variant-change="onVariantChange"
        />
      </div>

      <!-- ② Tabs -->
      <ProductTabs
        :product="product"
        :review-stats="reviewStats"
        :reviews-loading="reviewsLoading"
        class="mb-8"
      />

      <!-- ③ Related products -->
      <RelatedProducts
        v-if="product"
        :category-slug="product.category?.slug"
        :exclude-id="product._id"
      />

    </template>

    <!-- ④ Mobile sticky bottom bar -->
    <Transition name="slide-up">
      <div
        v-if="showStickyBar && product && !loading"
        class="fixed bottom-0 left-0 right-0 z-header md:hidden border-t border-surface-border shadow-modal px-4 py-3 flex items-center gap-3"
        style="background-color: var(--color-card);"
      >
        <div class="flex-1">
          <div
            v-if="selectedVariant?.comparePrice > selectedVariant?.price"
            class="text-text-disabled line-through text-xs font-fanum"
          >
            {{ formatPrice(selectedVariant.comparePrice) }}
          </div>
          <div class="font-black text-text-primary font-fanum text-lg">
            {{ formatPrice(selectedVariant?.price || product.minPrice) }}
          </div>
        </div>
        <BaseButton
          :disabled="!isInStock"
          :loading="addingToCart"
          @click="quickAddToCart"
          class="flex-1"
        >
          {{ isInStock ? 'افزودن به سبد' : 'ناموجود' }}
        </BaseButton>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import { productService }   from '@/services/product.service'
import { reviewService }    from '@/services/review.service'
import { useCartStore }     from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useUiStore }       from '@/stores/ui.store'
import { formatPrice }      from '@/utils/formatters'

import ProductGallery  from './components/ProductGallery.vue'
import ProductInfo     from './components/ProductInfo.vue'
import ProductTabs     from './components/ProductTabs.vue'
import RelatedProducts from './components/RelatedProducts.vue'
import BaseButton      from '@/components/common/BaseButton.vue'

const route         = useRoute()
const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()

const product         = ref(null)
const loading         = ref(true)
const notFound        = ref(false)
const reviewStats     = ref(null)
const reviewsLoading  = ref(false)
const selectedVariant = ref(null)
const addingToCart    = ref(false)
const galleryRef      = ref(null)
const infoRef         = ref(null)

// ── Sticky bar ────────────────────────────────────────────────────
const showStickyBar = ref(false)
let stopObserver = null

function setupStickyObserver() {
  const el = infoRef.value?.cartButtonRef
  if (!el) return
  const { stop } = useIntersectionObserver(el, ([entry]) => {
    showStickyBar.value = !entry.isIntersecting
  })
  stopObserver = stop
}

// ── Stock check for sticky bar ───────────────────────────────────
const isInStock = computed(() =>
  selectedVariant.value
    ? selectedVariant.value.stock > 0
    : (product.value?.totalStock ?? 0) > 0
)

// ── Fetch product ────────────────────────────────────────────────
async function fetchProduct() {
  const slug = route.params.slug
  loading.value = true
  notFound.value = false

  try {
    const { data } = await productService.getBySlug(slug)
    product.value = data
    if (data.variants?.length) selectedVariant.value = data.variants[0]
    document.title = `${data.name} | استورین`

    // Fetch initial review stats for the tab badge
    try {
      reviewsLoading.value = true
      const { data: reviewData } = await reviewService.getByProduct(data._id, { page: 1, limit: 1 })
      reviewStats.value = reviewData.stats ?? null
    } catch {
      // non-critical
    } finally {
      reviewsLoading.value = false
    }
  } catch (err) {
    if (err.response?.status === 404) {
      notFound.value = true
    } else {
      ui.addToast('خطا در بارگذاری محصول', 'error')
    }
  } finally {
    loading.value = false
    setTimeout(setupStickyObserver, 300)
  }
}

// ── Handlers ─────────────────────────────────────────────────────
function onVariantChange(variant) { selectedVariant.value = variant }
function onAddToCart() { /* handled inside ProductInfo */ }

async function quickAddToCart() {
  if (!isInStock.value || addingToCart.value) return
  addingToCart.value = true
  try {
    await cartStore.addItem(product.value._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد ✓', 'success')
  } catch {
    ui.addToast('خطا در افزودن به سبد', 'error')
  } finally {
    addingToCart.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.allSettled([
    fetchProduct(),
    wishlistStore.fetchWishlist(),
  ])
})

onUnmounted(() => {
  stopObserver?.()
  document.title = 'استورین | فروشگاه تخصصی عینک'
})

// Re-fetch on slug change (nav between products)
watch(() => route.params.slug, (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    product.value = null
    selectedVariant.value = null
    fetchProduct()
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
