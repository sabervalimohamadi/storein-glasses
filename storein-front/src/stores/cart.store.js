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

  async function addItem(productId, quantity = 1) {
    const { data } = await cartService.addItem(productId, quantity)
    items.value = data.items
  }

  async function updateItem(itemId, quantity) {
    const { data } = await cartService.updateItem(itemId, quantity)
    items.value = data.items
  }

  async function removeItem(itemId) {
    const { data } = await cartService.removeItem(itemId)
    items.value = data.items
  }

  async function clearCart() {
    await cartService.clear()
    items.value = []
  }

  return { items, loading, totalItems, totalPrice, fetchCart, addItem, updateItem, removeItem, clearCart }
})
