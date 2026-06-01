import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productService } from '@/services/product.service'

export const useProductStore = defineStore('product', () => {
  const products       = ref([])
  const currentProduct = ref(null)
  const loading        = ref(false)
  const pagination     = ref({ page: 1, limit: 24, total: 0 })

  const filters = ref({
    sortBy:        'newest',
    minPrice:      null,
    maxPrice:      null,
    inStock:       false,
    category:      null,
    gender:        null,
    frameShape:    null,
    frameMaterial: null,
    brand:         null,
    color:         null,
  })

  async function fetchProducts(params = {}) {
    loading.value = true
    try {
      const { data } = await productService.getAll({
        ...filters.value,
        page:  pagination.value.page,
        limit: pagination.value.limit,
        ...params,
      })
      products.value         = data.items
      pagination.value.total = data.total
    } finally { loading.value = false }
  }

  async function fetchProductBySlug(slug) {
    loading.value = true
    try {
      const { data } = await productService.getBySlug(slug)
      currentProduct.value = data
    } finally { loading.value = false }
  }

  function setFilter(key, value) {
    filters.value[key]    = value
    pagination.value.page = 1
  }

  function resetFilters() {
    Object.keys(filters.value).forEach((k) => {
      filters.value[k] = k === 'sortBy' ? 'newest' : null
    })
    filters.value.inStock = false
    pagination.value.page = 1
  }

  return {
    products, currentProduct, loading, pagination, filters,
    fetchProducts, fetchProductBySlug, setFilter, resetFilters,
  }
})
