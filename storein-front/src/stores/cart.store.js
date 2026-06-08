import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartService } from '@/services/cart.service'

export const useCartStore = defineStore('cart', () => {
  const items   = ref([])
  const loading = ref(false)

  const totalItems = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const totalPrice = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))

  async function fetchCart() {
    loading.value = true
    try {
      const { data } = await cartService.get()
      items.value = data.items ?? []
    } finally { loading.value = false }
  }

  async function addItem(productId, variantId, quantity = 1) {
    const { data } = await cartService.addItem(productId, variantId, quantity)
    items.value = data.items
  }

  async function updateItem(productId, variantId, quantity) {
    const { data } = await cartService.updateItem(productId, variantId, quantity)
    items.value = data.items
  }

  async function removeItem(productId, variantId) {
    const { data } = await cartService.removeItem(productId, variantId)
    items.value = data.items
  }

  async function clearCart() {
    await cartService.clear()
    items.value = []
  }

  return { items, loading, totalItems, totalPrice, fetchCart, addItem, updateItem, removeItem, clearCart }
})
