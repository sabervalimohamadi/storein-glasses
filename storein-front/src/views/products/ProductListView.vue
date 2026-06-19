<template>
  <div class="container-main py-4">

    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-text-secondary mb-4">
      <RouterLink to="/" class="hover:text-brand transition-colors">خانه</RouterLink>
      <svg class="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor"
           stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
      <span v-if="currentCategory" class="text-text-primary font-medium">
        {{ currentCategory.name }}
      </span>
      <span v-else class="text-text-primary font-medium">همه محصولات</span>
    </nav>

    <!-- Page title -->
    <h1 class="text-xl font-bold text-text-primary mb-5">
      {{ currentCategory ? currentCategory.name : 'همه محصولات' }}
    </h1>

    <!-- Main layout: sidebar (right) + content (left) in RTL -->
    <div class="flex gap-5 items-start">

      <!-- ① Filter Sidebar — desktop only; comes first in DOM = right in RTL -->
      <div class="hidden lg:block sticky top-20 self-start">
        <FilterSidebar
          :filters="productStore.filters"
          @change="onFilterChange"
        />
      </div>

      <!-- ② Main content -->
      <div class="flex-1 min-w-0">

        <!-- Sort bar -->
        <SortBar
          v-model="productStore.filters.sortBy"
          :total="productStore.total"
          :loading="productStore.loading"
          @update:modelValue="onFilterChange"
          @open-filter="mobileFilterOpen = true"
        />

        <!-- Active filter chips -->
        <ActiveFilters
          :filters="productStore.filters"
          @remove="removeFilter"
          @clear-all="clearAllFilters"
        />

        <!-- Product grid -->
        <ProductGrid
          :products="productStore.products"
          :loading="productStore.loading"
        />

        <!-- Pagination -->
        <BasePagination
          :model-value="productStore.page"
          :total-pages="productStore.totalPages"
          :loading="productStore.loading"
          @update:modelValue="onPageChange"
          class="mt-6"
        />

      </div>
    </div>

    <!-- Mobile filter drawer -->
    <FilterMobileDrawer
      v-model="mobileFilterOpen"
      :filters="productStore.filters"
      @apply="onMobileFilterApply"
      @clear="clearAllFilters"
    />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useProductStore }  from '@/stores/product.store'
import { useCategoryStore } from '@/stores/category.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useSeoHead } from '@/composables/useSeoHead'

import FilterSidebar      from './components/FilterSidebar.vue'
import FilterMobileDrawer from './components/FilterMobileDrawer.vue'
import SortBar            from './components/SortBar.vue'
import ActiveFilters      from './components/ActiveFilters.vue'
import ProductGrid        from './components/ProductGrid.vue'
import BasePagination     from '@/components/common/BasePagination.vue'

const route         = useRoute()
const router        = useRouter()
const productStore  = useProductStore()
const categoryStore = useCategoryStore()
const wishlistStore = useWishlistStore()

const mobileFilterOpen = ref(false)

// ── SEO ──────────────────────────────────────────────────────────
useSeoHead({
  title:         computed(() => currentCategory.value?.name || 'همه محصولات'),
  description:   computed(() => currentCategory.value?.description || 'خرید انواع عینک طبی، آفتابی و لنز با بهترین قیمت'),
  canonicalPath: computed(() => route.params.slug ? `/category/${route.params.slug}` : '/products'),
})

// ── Current category from route params or store filter ─────────
const currentCategory = computed(() => {
  const slug = route.params.slug || productStore.filters.category
  if (!slug) return null
  const flat = []
  function flatten(nodes) {
    if (!Array.isArray(nodes)) return
    nodes.forEach(n => { flat.push(n); if (n.children?.length) flatten(n.children) })
  }
  flatten(categoryStore.categories)
  return flat.find(c => c.slug === slug) || null
})

// ── Init: read URL → fill filters → fetch ──────────────────────
onMounted(async () => {
  await categoryStore.fetchCategories()
  productStore.fromQueryParams(route.query)
  if (route.params.slug) {
    productStore.filters.category = route.params.slug
  }
  await Promise.allSettled([
    productStore.fetchProducts(),
    wishlistStore.fetchWishlist(),
  ])
})

// ── React to /category/:slug navigation ────────────────────────
watch(() => route.params.slug, async (slug, prevSlug) => {
  if (slug === prevSlug) return
  productStore.resetFilters()
  if (slug) productStore.filters.category = slug
  productStore.fromQueryParams(route.query)
  await productStore.fetchProducts()
  syncUrl()
})

// ── Debounced re-fetch on any filter change ─────────────────────
const debouncedFetch = useDebounceFn(async () => {
  productStore.page = 1
  await productStore.fetchProducts()
  syncUrl()
}, 300)

function onFilterChange() { debouncedFetch() }

// ── Page change ─────────────────────────────────────────────────
async function onPageChange(p) {
  productStore.setPage(p)
  await productStore.fetchProducts()
  syncUrl()
}

// ── Sync URL with current filter state ─────────────────────────
function syncUrl() {
  const query = productStore.toQueryParams()
  // /category/:slug route — don't duplicate category into query string
  if (route.params.slug) delete query.category
  router.replace({ query })
}

// ── Remove one filter chip ──────────────────────────────────────
function removeFilter(key, value) {
  if (key === 'inStock') {
    productStore.filters.inStock = false
  } else if (key === 'minPrice') {
    productStore.filters.minPrice = null
  } else if (key === 'maxPrice') {
    productStore.filters.maxPrice = null
  } else if (key === 'category') {
    productStore.filters.category = null
  } else if (Array.isArray(productStore.filters[key])) {
    productStore.filters[key] = productStore.filters[key].filter(v => v !== value)
  }
  debouncedFetch()
}

// ── Clear all filters (preserve category if on /category/:slug) ─
function clearAllFilters() {
  const currentCat = route.params.slug || null
  productStore.resetFilters()
  if (currentCat) productStore.filters.category = currentCat
  mobileFilterOpen.value = false
  debouncedFetch()
}

// ── Mobile drawer apply ─────────────────────────────────────────
function onMobileFilterApply(newFilters) {
  Object.assign(productStore.filters, newFilters)
  mobileFilterOpen.value = false
  debouncedFetch()
}
</script>
