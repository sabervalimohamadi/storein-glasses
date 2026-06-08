<template>
  <div class="container-main py-8 min-h-[60vh]">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-text-primary">
        سبد خرید
        <span v-if="cartStore.items.length" class="font-fanum text-text-secondary text-base font-normal mr-2">
          ({{ formatNumber(cartStore.totalItems) }} کالا)
        </span>
      </h1>

      <!-- Clear cart -->
      <template v-if="cartStore.items.length">
        <div v-if="confirmingClear" class="flex items-center gap-2 text-sm">
          <span class="text-text-secondary">پاک شود؟</span>
          <button @click="doClear" :disabled="clearing" class="text-error font-medium hover:underline disabled:opacity-50">بله</button>
          <button @click="confirmingClear = false" class="text-text-secondary hover:underline">خیر</button>
        </div>
        <button v-else @click="confirmingClear = true" class="text-sm text-text-secondary hover:text-error transition-colors">
          پاک کردن سبد
        </button>
      </template>
    </div>

    <!-- Loading skeletons -->
    <div v-if="cartStore.loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 flex flex-col gap-4">
        <div
          v-for="i in 3" :key="i"
          class="h-32 rounded-2xl skeleton"
        />
      </div>
      <div class="h-72 rounded-2xl skeleton" />
    </div>

    <!-- Empty state -->
    <BaseEmpty
      v-else-if="!cartStore.items.length"
      icon="🛒"
      title="سبد خرید شما خالی است"
      subtitle="محصولات مورد علاقه‌تان را به سبد خرید اضافه کنید"
      action="مشاهده محصولات"
      :to="{ name: 'products' }"
    />

    <!-- Cart content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      <!-- ── Items list ── -->
      <div class="lg:col-span-2 flex flex-col gap-4">
        <TransitionGroup name="cart-item" tag="div" class="flex flex-col gap-4">
          <div
            v-for="item in cartStore.items"
            :key="itemKey(item)"
            class="flex gap-4 p-4 rounded-2xl border border-surface-border transition-all"
            style="background-color: var(--color-card)"
          >
            <!-- Product image -->
            <component
              :is="item.slug ? 'RouterLink' : 'div'"
              v-bind="item.slug ? { to: { name: 'product-detail', params: { slug: item.slug } } } : {}"
              class="flex-shrink-0"
            >
              <img
                :src="item.thumbnail || PLACEHOLDER"
                :alt="item.name"
                class="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl"
                @error="e => e.target.src = PLACEHOLDER"
              />
            </component>

            <!-- Info -->
            <div class="flex-1 min-w-0 flex flex-col gap-2">

              <!-- Name -->
              <component
                :is="item.slug ? 'RouterLink' : 'span'"
                v-bind="item.slug ? { to: { name: 'product-detail', params: { slug: item.slug } } } : {}"
                class="text-text-primary font-medium text-sm leading-6 hover:text-brand line-clamp-2 transition-colors"
              >
                {{ item.name }}
              </component>

              <!-- Attributes chips -->
              <div v-if="item.attributes?.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="attr in item.attributes" :key="attr.key"
                  class="text-xs text-text-secondary bg-surface px-2 py-0.5 rounded-lg border border-surface-border"
                >
                  {{ attr.key }}: {{ attr.value }}
                </span>
              </div>

              <!-- Low stock warning -->
              <span v-if="item.stock <= 5 && item.stock > 0" class="text-warning text-xs font-fanum">
                تنها {{ formatNumber(item.stock) }} عدد باقی‌مانده
              </span>

              <!-- Price + Stepper -->
              <div class="flex items-center justify-between mt-auto flex-wrap gap-3 pt-1">

                <!-- Price -->
                <div>
                  <div v-if="item.comparePrice > item.price" class="text-text-disabled line-through text-xs font-fanum leading-none mb-0.5">
                    {{ formatPrice(item.comparePrice) }}
                  </div>
                  <div class="text-text-primary font-bold font-fanum">
                    {{ formatPrice(item.price) }}
                  </div>
                  <div class="text-text-secondary text-xs font-fanum mt-0.5">
                    جمع: {{ formatPrice(item.price * item.quantity) }}
                  </div>
                </div>

                <!-- Stepper + Remove -->
                <div class="flex items-center gap-3">

                  <!-- Remove button -->
                  <button
                    @click="handleRemove(item)"
                    :disabled="removingKey === itemKey(item)"
                    class="text-text-disabled hover:text-error transition-colors disabled:opacity-50 p-1"
                    title="حذف از سبد"
                  >
                    <svg v-if="removingKey === itemKey(item)" class="w-5 h-5 animate-spin text-error" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>

                  <!-- Quantity stepper -->
                  <div class="flex items-center border border-surface-border rounded-xl overflow-hidden">
                    <button
                      @click="changeQty(item, item.quantity - 1)"
                      :disabled="item.quantity <= 1 || updatingKey === itemKey(item)"
                      class="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" d="M20 12H4"/>
                      </svg>
                    </button>

                    <span class="w-10 text-center font-fanum text-sm font-bold text-text-primary select-none">
                      {{ formatNumber(item.quantity) }}
                    </span>

                    <button
                      @click="changeQty(item, item.quantity + 1)"
                      :disabled="item.quantity >= item.stock || updatingKey === itemKey(item)"
                      class="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
                      </svg>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- ── Order summary ── -->
      <div
        class="rounded-2xl border border-surface-border p-5 flex flex-col gap-4 lg:sticky lg:top-24"
        style="background-color: var(--color-card)"
      >
        <h2 class="font-bold text-text-primary text-base border-b border-surface-border pb-3">
          خلاصه سفارش
        </h2>

        <div class="flex flex-col gap-3 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">تعداد کالا</span>
            <span class="font-fanum text-text-primary">{{ formatNumber(cartStore.totalItems) }} عدد</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">قیمت اصلی</span>
            <span class="font-fanum text-text-primary">{{ formatPrice(subtotal) }}</span>
          </div>
          <div v-if="savings > 0" class="flex justify-between items-center text-success">
            <span>تخفیف</span>
            <span class="font-fanum">− {{ formatPrice(savings) }}</span>
          </div>
        </div>

        <div class="border-t border-surface-border pt-4">
          <div class="flex justify-between items-center">
            <span class="font-bold text-text-primary">مبلغ قابل پرداخت</span>
            <span class="text-brand text-xl font-black font-fanum">{{ formatPrice(cartStore.totalPrice) }}</span>
          </div>
          <p v-if="savings > 0" class="text-success text-xs mt-2 font-fanum text-left">
            {{ formatPrice(savings) }} صرفه‌جویی کردید
          </p>
        </div>

        <BaseButton
          variant="primary"
          block
          size="lg"
          @click="$router.push({ name: 'checkout' })"
        >
          ادامه و پرداخت
          <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
          </svg>
        </BaseButton>

        <RouterLink
          :to="{ name: 'products' }"
          class="text-center text-sm text-brand hover:underline"
        >
          ← ادامه خرید
        </RouterLink>

        <!-- Trust badges -->
        <div class="border-t border-surface-border pt-4 grid grid-cols-2 gap-3">
          <div v-for="t in trustBadges" :key="t.icon" class="flex items-center gap-1.5 text-xs text-text-secondary">
            <span>{{ t.icon }}</span>
            <span>{{ t.label }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore }  from '@/stores/cart.store'
import { useUiStore }    from '@/stores/ui.store'
import { formatPrice, formatNumber } from '@/utils/formatters'
import BaseEmpty    from '@/components/common/BaseEmpty.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import BaseButton   from '@/components/common/BaseButton.vue'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="%23e2e8f0"%3E%3Crect width="96" height="96"/%3E%3C/svg%3E'

const cartStore = useCartStore()
const ui        = useUiStore()

const updatingKey     = ref(null)
const removingKey     = ref(null)
const clearing        = ref(false)
const confirmingClear = ref(false)

const subtotal = computed(() =>
  cartStore.items.reduce((s, i) => {
    const base = i.comparePrice > i.price ? i.comparePrice : i.price
    return s + base * i.quantity
  }, 0)
)
const savings = computed(() => subtotal.value - cartStore.totalPrice)

function itemKey(item) {
  return `${item.productId}-${item.variantId}`
}

async function changeQty(item, newQty) {
  if (newQty < 1 || newQty > item.stock) return
  const key = itemKey(item)
  if (updatingKey.value === key) return
  updatingKey.value = key
  try {
    await cartStore.updateItem(item.productId, item.variantId, newQty)
  } catch {
    ui.addToast('خطا در بروزرسانی تعداد', 'error')
  } finally {
    updatingKey.value = null
  }
}

async function handleRemove(item) {
  const key = itemKey(item)
  if (removingKey.value === key) return
  removingKey.value = key
  try {
    await cartStore.removeItem(item.productId, item.variantId)
    ui.addToast('کالا از سبد حذف شد', 'success')
  } catch {
    ui.addToast('خطا در حذف کالا', 'error')
  } finally {
    removingKey.value = null
  }
}

async function doClear() {
  clearing.value = true
  try {
    await cartStore.clearCart()
    confirmingClear.value = false
    ui.addToast('سبد خرید پاک شد', 'success')
  } catch {
    ui.addToast('خطا در پاک کردن سبد', 'error')
  } finally {
    clearing.value = false
  }
}

const trustBadges = [
  { icon: '🔒', label: 'پرداخت امن' },
  { icon: '↩️', label: 'ضمانت بازگشت' },
  { icon: '✅', label: 'اصالت کالا' },
  { icon: '🚚', label: 'ارسال سریع' },
]

onMounted(() => cartStore.fetchCart())
</script>

<style scoped>
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.3s ease;
}
.cart-item-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
  max-height: 0;
}
</style>
