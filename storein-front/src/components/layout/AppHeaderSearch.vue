<template>
  <div ref="wrapper" class="relative w-full">
    <!-- Input -->
    <div class="relative">
      <span class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-text-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
      </span>
      <input
        v-model="query"
        type="text"
        dir="rtl"
        placeholder="جستجو در عینک، فریم، لنز ..."
        class="w-full pr-10 pl-4 py-2.5 bg-surface rounded-xl border border-surface-border text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
        @focus="onFocus"
        @keydown.enter="handleSearch"
        @keydown.esc="close"
      />
    </div>

    <!-- Dropdown -->
    <Transition name="search-drop">
      <div
        v-if="isOpen && query.trim().length >= 1"
        class="absolute top-full mt-1 w-full bg-white rounded-xl shadow-dropdown z-dropdown border border-surface-border overflow-hidden"
      >
        <!-- Loading -->
        <div v-if="loading" class="p-3 space-y-2">
          <BaseSkeleton v-for="i in 5" :key="i" height="1.5rem" />
        </div>

        <!-- Results -->
        <template v-else>
          <template v-if="hasResults">
            <!-- Product suggestions -->
            <div v-if="suggestions.products?.length">
              <div class="px-3 pt-3 pb-1 text-xs font-semibold text-text-secondary">پیشنهادات</div>
              <button
                v-for="item in suggestions.products"
                :key="item.slug"
                type="button"
                class="w-full text-right px-3 py-2.5 hover:bg-surface text-sm text-text-primary flex items-center gap-2 transition-colors"
                @click="goToProduct(item)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-text-secondary shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                </svg>
                {{ item.name }}
              </button>
            </div>

            <!-- Category suggestions -->
            <div v-if="suggestions.categories?.length">
              <div class="px-3 pt-3 pb-1 text-xs font-semibold text-text-secondary">دسته‌بندی‌ها</div>
              <button
                v-for="cat in suggestions.categories"
                :key="cat.slug"
                type="button"
                class="w-full text-right px-3 py-2.5 hover:bg-surface text-sm text-text-primary flex items-center gap-2 transition-colors"
                @click="goToCategory(cat)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-text-secondary shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                </svg>
                {{ cat.name }}
              </button>
            </div>
          </template>

          <!-- No results -->
          <div v-else class="py-8 text-center text-sm text-text-secondary">
            نتیجه‌ای یافت نشد
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside, useDebounceFn } from '@vueuse/core'
import http from '@/services/http.service'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'

const router    = useRouter()
const wrapper   = ref(null)
const query     = ref('')
const isOpen    = ref(false)
const loading   = ref(false)
const suggestions = ref({ products: [], categories: [] })

const hasResults = computed(() =>
  suggestions.value.products?.length > 0 || suggestions.value.categories?.length > 0
)

onClickOutside(wrapper, close)

function onFocus() { isOpen.value = true }
function close()   { isOpen.value = false }

const fetchSuggestions = useDebounceFn(async (q) => {
  if (!q.trim()) { suggestions.value = { products: [], categories: [] }; return }
  loading.value = true
  try {
    const { data } = await http.get('/search/suggest', { params: { q } })
    suggestions.value = data || { products: [], categories: [] }
  } catch {
    suggestions.value = { products: [], categories: [] }
  } finally {
    loading.value = false
  }
}, 300)

watch(query, fetchSuggestions)

function handleSearch() {
  if (!query.value.trim()) return
  router.push({ name: 'search', query: { q: query.value.trim() } })
  close()
}

function goToProduct(item) {
  router.push({ name: 'product-detail', params: { slug: item.slug } })
  close()
  query.value = ''
}

function goToCategory(cat) {
  router.push({ name: 'category', params: { slug: cat.slug } })
  close()
  query.value = ''
}
</script>

<style scoped>
.search-drop-enter-active,
.search-drop-leave-active { transition: all 0.15s ease; }
.search-drop-enter-from,
.search-drop-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
