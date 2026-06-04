<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title">محصولات</h1>
        <p v-if="!loading" class="text-text-secondary text-sm mt-0.5 font-fanum">
          {{ formatNumber(total) }} کالا
        </p>
      </div>
      <RouterLink :to="{ name: 'product-create' }">
        <AdminButton>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
          </svg>
          محصول جدید
        </AdminButton>
      </RouterLink>
    </div>

    <!-- Filters -->
    <ProductFilters :categories="categories" @change="onFilterChange" />

    <!-- Table -->
    <div class="admin-card p-0 overflow-hidden">
      <AdminTable :columns="columns" :rows="products" :loading="loading" :skeleton-rows="10" empty-text="محصولی یافت نشد">

        <!-- Image + name -->
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <img
              :src="row.images?.[0]?.thumbnail || row.images?.[0]?.url"
              :alt="row.name"
              class="w-10 h-10 rounded-lg object-cover border border-border bg-surface flex-shrink-0"
              @error="e => (e.target.style.display = 'none')"
            />
            <div class="min-w-0">
              <RouterLink
                :to="{ name: 'product-edit', params: { id: row._id } }"
                class="font-medium text-text-primary hover:text-primary transition-colors text-sm truncate block max-w-[200px]"
              >
                {{ row.name }}
              </RouterLink>
              <p class="text-text-disabled text-xs font-mono" dir="ltr">{{ row.slug }}</p>
            </div>
          </div>
        </template>

        <!-- Category -->
        <template #cell-category="{ row }">
          <span class="text-text-secondary text-sm">{{ row.category?.name ?? '—' }}</span>
        </template>

        <!-- Price -->
        <template #cell-minPrice="{ row }">
          <span class="font-fanum text-sm font-medium text-text-primary">
            {{ formatPrice(row.minPrice) }}
          </span>
        </template>

        <!-- Stock -->
        <template #cell-totalStock="{ row }">
          <span :class="[
            'font-fanum text-sm font-bold',
            row.totalStock === 0 ? 'text-error'
            : row.totalStock <= 5 ? 'text-warning'
            : 'text-text-primary',
          ]">
            {{ formatNumber(row.totalStock) }}
          </span>
        </template>

        <!-- Status inline select (optimistic toggle) -->
        <template #cell-status="{ row }">
          <select
            :value="row.status"
            @change="changeStatus(row, $event.target.value)"
            :class="[
              'text-xs font-medium px-2 py-1 rounded-lg border outline-none cursor-pointer transition-colors',
              statusSelectClass(row.status),
            ]"
          >
            <option value="active">فعال</option>
            <option value="draft">پیش‌نویس</option>
            <option value="inactive">غیرفعال</option>
          </select>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1 justify-center">
            <RouterLink :to="{ name: 'product-edit', params: { id: row._id } }"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </RouterLink>
            <button @click="confirmDelete(row)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-red-50 hover:text-error transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </template>

      </AdminTable>
    </div>

    <!-- Pagination -->
    <AdminPagination
      v-model="page"
      :total-pages="totalPages"
      :loading="loading"
      @update:modelValue="fetchProducts"
    />

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="deleteDialog.open"
      title="حذف محصول"
      :message="`آیا از حذف «${deleteDialog.product?.name}» مطمئنید؟ این عمل قابل بازگشت نیست.`"
      confirm-label="بله، حذف شود"
      confirm-variant="danger"
      :loading="deleteDialog.loading"
      @confirm="doDelete"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { productService }  from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { useUiStore }      from '@/stores/ui.store'
import { formatPrice, formatNumber } from '@/utils/formatters'
import { ITEMS_PER_PAGE } from '@/utils/constants'

import ProductFilters  from './components/ProductFilters.vue'
import AdminTable      from '@/components/common/AdminTable.vue'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'
import AdminConfirm    from '@/components/common/AdminConfirm.vue'

const ui = useUiStore()

const products      = ref([])
const categories    = ref([])
const loading       = ref(true)
const total         = ref(0)
const page          = ref(1)
const activeFilters = ref({ search: '', categoryId: '', status: '', sortBy: 'newest' })
const deleteDialog  = ref({ open: false, product: null, loading: false })

const totalPages = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE))

const columns = [
  { key: 'name',       label: 'نام محصول',  width: '280px' },
  { key: 'category',   label: 'دسته‌بندی',  width: '120px' },
  { key: 'minPrice',   label: 'قیمت',        width: '130px', align: 'center' },
  { key: 'totalStock', label: 'موجودی',      width: '90px',  align: 'center', sortable: true },
  { key: 'status',     label: 'وضعیت',       width: '110px', align: 'center' },
  { key: 'actions',    label: '',            width: '80px',  align: 'center' },
]

async function fetchProducts() {
  loading.value = true
  try {
    const { data } = await productService.getAll({
      page:     page.value,
      limit:    ITEMS_PER_PAGE,
      search:   activeFilters.value.search     || undefined,
      category: activeFilters.value.categoryId || undefined,
      status:   activeFilters.value.status     || undefined,
      sort:     activeFilters.value.sortBy,
    })
    products.value = data?.products ?? []
    total.value    = data?.total    ?? 0
  } catch {
    ui.addToast('خطا در بارگذاری محصولات', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const { data } = await categoryService.getAll({ limit: 200 })
    categories.value = data?.items ?? []
  } catch { /* non-critical */ }
}

function onFilterChange(filters) {
  activeFilters.value = filters
  page.value = 1
  fetchProducts()
}

async function changeStatus(product, newStatus) {
  const prev = product.status
  product.status = newStatus
  try {
    await productService.toggleStatus(product._id, newStatus)
    ui.addToast(`وضعیت «${product.name}» تغییر کرد`, 'success')
  } catch {
    product.status = prev
    ui.addToast('خطا در تغییر وضعیت', 'error')
  }
}

function confirmDelete(product) {
  deleteDialog.value = { open: true, product, loading: false }
}

async function doDelete() {
  const product = deleteDialog.value.product
  deleteDialog.value.loading = true
  try {
    await productService.remove(product._id)
    products.value = products.value.filter(p => p._id !== product._id)
    total.value--
    ui.addToast(`محصول «${product.name}» حذف شد`, 'success')
    deleteDialog.value.open = false
  } catch {
    ui.addToast('خطا در حذف محصول', 'error')
  } finally {
    deleteDialog.value.loading = false
  }
}

function statusSelectClass(status) {
  return {
    active:   'bg-green-100 text-green-700 border-green-200',
    draft:    'bg-yellow-100 text-yellow-700 border-yellow-200',
    inactive: 'bg-red-100 text-red-700 border-red-200',
  }[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

onMounted(() => Promise.allSettled([fetchProducts(), fetchCategories()]))
</script>
