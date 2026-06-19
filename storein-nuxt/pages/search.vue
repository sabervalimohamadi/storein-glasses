<template>
  <div class="container-main py-4">

    <nav class="flex items-center gap-2 text-sm text-text-secondary mb-4">
      <NuxtLink to="/" class="hover:text-brand transition-colors">خانه</NuxtLink>
      <svg class="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
      <span class="text-text-primary font-medium">نتایج جستجو</span>
    </nav>

    <div class="rounded-xl shadow-card px-5 py-4 mb-4" style="background-color: var(--color-card);">
      <div class="flex items-center gap-3 flex-wrap">
        <svg class="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
        </svg>
        <div>
          <span class="text-text-secondary text-sm">نتایج جستجو برای: </span>
          <span class="text-text-primary font-bold text-lg">"{{ searchQuery }}"</span>
        </div>
        <span v-if="!loading && searchQuery" class="text-text-secondary text-sm font-fanum mr-auto">
          <span class="text-text-primary font-bold">{{ formatNumber(total) }}</span> کالا
        </span>
      </div>
    </div>

    <SortBar v-model="sortBy" :total="total" :loading="loading" @update:modelValue="onSortChange" />

    <ProductGrid :products="products" :loading="loading" />

    <div v-if="!loading && products.length === 0 && searchQuery" class="text-center py-16">
      <div class="text-6xl mb-4 select-none">🔍</div>
      <h2 class="text-xl font-bold text-text-primary mb-2">نتیجه‌ای برای "{{ searchQuery }}" یافت نشد</h2>
      <p class="text-text-secondary mb-6 text-sm leading-7">لغت کلیدی دیگری امتحان کنید یا محصولات ما را مرور کنید</p>
      <NuxtLink to="/products" class="inline-block bg-brand text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors">مشاهده همه محصولات</NuxtLink>
    </div>

    <BasePagination
      :model-value="currentPage"
      :total-pages="totalPages"
      :loading="loading"
      @update:modelValue="onPageChange"
      class="mt-6"
    />
  </div>
</template>

<script setup>
import { formatNumber } from '~/utils/formatters'
import SortBar        from '~/components/products/SortBar.vue'
import ProductGrid    from '~/components/products/ProductGrid.vue'
import BasePagination from '~/components/common/BasePagination.vue'
import { productService } from '~/services/product.service'

definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'جستجو', robots: 'noindex' })

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const products    = ref([])
const loading     = ref(false)
const total       = ref(0)
const currentPage = ref(1)
const sortBy      = ref('newest')
const LIMIT       = 24

const searchQuery = computed(() => String(route.query.q || '').trim())
const totalPages  = computed(() => Math.max(1, Math.ceil(total.value / LIMIT)))

async function fetchSearch() {
  if (!searchQuery.value) { products.value = []; total.value = 0; return }
  loading.value = true
  try {
    const { data } = await productService.search(searchQuery.value, {
      page: currentPage.value, limit: LIMIT, sort: sortBy.value,
    })
    products.value = data?.products ?? data?.items ?? []
    total.value    = data?.total ?? 0
  } catch {
    ui.addToast('خطا در جستجو. دوباره تلاش کنید', 'error')
    products.value = []
    total.value    = 0
  } finally { loading.value = false }
}

onMounted(async () => {
  sortBy.value      = route.query.sortBy || 'newest'
  currentPage.value = Number(route.query.page) || 1
  await fetchSearch()
})

watch(searchQuery, async () => { currentPage.value = 1; await fetchSearch() })

function onSortChange() {
  currentPage.value = 1
  fetchSearch()
  router.replace({ query: { ...route.query, sortBy: sortBy.value, page: undefined } })
}

async function onPageChange(p) {
  currentPage.value = p
  await fetchSearch()
  router.replace({ query: { ...route.query, page: p > 1 ? p : undefined } })
}
</script>
