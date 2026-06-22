<template>
  <!-- Skeleton -->
  <div v-if="loading" class="rounded-2xl shadow-card overflow-hidden" style="background-color: var(--color-card);">
    <div class="aspect-square" style="background-color: var(--color-surface, #f3f4f6);" />
    <div class="p-4 space-y-3">
      <div class="h-4 rounded" style="background-color: var(--color-surface, #f3f4f6);" />
      <div class="h-4 rounded w-3/4" style="background-color: var(--color-surface, #f3f4f6);" />
      <div class="h-20 rounded" style="background-color: var(--color-surface, #f3f4f6);" />
      <div class="h-10 rounded" style="background-color: var(--color-surface, #f3f4f6);" />
    </div>
  </div>

  <!-- Wholesale card -->
  <article
    v-else
    class="rounded-2xl shadow-card overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col h-full"
    style="background-color: var(--color-card);"
    @click="goToProduct"
  >
    <!-- Image area -->
    <div class="aspect-square relative shrink-0 overflow-hidden p-3" style="background-color: var(--color-card);">

      <!-- Wholesale badge — top-start (right in RTL) -->
      <div class="absolute top-2 start-2 z-10">
        <span style="background: rgba(245,158,11,0.15); color: #b45309; font-size: 11px; font-weight: 700;
                     padding: 2px 8px; border-radius: 20px; border: 1px solid rgba(245,158,11,0.3);">
          🏪 عمده
        </span>
      </div>

      <img
        :src="imgSrc"
        :alt="product.name"
        class="w-full h-full object-contain"
        loading="lazy"
        @error="imgError = true"
      />

      <!-- Out of stock overlay -->
      <div v-if="product.totalStock === 0" class="absolute inset-0 bg-white/75 flex items-center justify-center">
        <span class="text-gray-700 font-semibold text-sm px-3 py-1.5 bg-white rounded-full shadow-sm">ناموجود</span>
      </div>
    </div>

    <!-- Body -->
    <div class="p-4 flex flex-col gap-3 flex-1">

      <!-- Name -->
      <h3 class="text-sm font-bold line-clamp-2 leading-relaxed" style="color: var(--color-text-primary); min-height: 2.5rem;">
        {{ product.name }}
      </h3>

      <!-- Price block -->
      <div
        v-if="wholesaleVariant"
        style="background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 10px 12px;"
      >
        <!-- Row 1: Wholesale price -->
        <div class="flex items-baseline justify-between mb-1">
          <span style="font-size: 11px; color: var(--color-text-secondary);">قیمت عمده</span>
          <span style="font-size: 17px; font-weight: 700; color: #b45309; font-family: var(--font-fanum);">
            {{ formatPrice(wholesaleVariant.wholesalePrice) }}
          </span>
        </div>

        <!-- Row 2: Retail price strikethrough -->
        <div class="flex items-baseline justify-between mb-2">
          <span style="font-size: 11px; color: var(--color-text-secondary);">قیمت تکی</span>
          <span style="font-size: 13px; text-decoration: line-through; color: var(--color-text-secondary); font-family: var(--font-fanum);">
            {{ formatPrice(wholesaleVariant.price) }}
          </span>
        </div>

        <!-- Divider -->
        <div style="border-top: 1px solid rgba(245,158,11,0.2); margin-bottom: 8px;" />

        <!-- Row 3: Savings + MinQty -->
        <div class="flex items-center justify-between">
          <span style="font-size: 11px; font-weight: 600; color: #16a34a;
                       background: rgba(34,197,94,0.1); padding: 2px 8px;
                       border-radius: 20px; font-family: var(--font-fanum);">
            {{ formatPrice(savings) }} ارزان‌تر
          </span>
          <span style="font-size: 11px; font-weight: 700; color: #b45309;
                       background: rgba(245,158,11,0.15); padding: 2px 10px;
                       border-radius: 20px; border: 1px solid rgba(245,158,11,0.25);">
            حداقل {{ formatNumber(minQty) }} عدد
          </span>
        </div>
      </div>

      <!-- Fallback: no wholesale price -->
      <div v-else class="text-sm text-center py-3" style="color: var(--color-text-secondary);">
        قیمت عمده تعیین نشده
      </div>

      <!-- Quantity selector + Add to cart -->
      <div v-if="wholesaleVariant" class="flex gap-2 mt-auto" @click.stop>

        <!-- Qty stepper (steps by minQty) -->
        <div
          class="flex items-center border rounded-xl overflow-hidden shrink-0"
          style="border-color: var(--color-border); background: var(--color-bg);"
        >
          <button
            type="button"
            class="px-2.5 py-2 text-lg font-bold transition-colors hover:bg-surface"
            style="color: var(--color-text-primary);"
            @click="qty = Math.max(minQty, qty - minQty)"
          >−</button>
          <span
            class="px-2 text-sm font-bold min-w-[2rem] text-center font-fanum"
            style="color: var(--color-text-primary);"
          >{{ formatNumber(qty) }}</span>
          <button
            type="button"
            class="px-2.5 py-2 text-lg font-bold transition-colors hover:bg-surface"
            style="color: var(--color-text-primary);"
            @click="qty += minQty"
          >+</button>
        </div>

        <!-- Add to cart -->
        <button
          type="button"
          class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style="background: linear-gradient(135deg, #f59e0b, #d97706);"
          :disabled="product.totalStock === 0 || addingToCart"
          @click.stop="addToCart"
        >
          <span v-if="addingToCart" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <span v-else>{{ isInCart ? '✓ در سبد' : 'افزودن به سبد' }}</span>
        </button>
      </div>

    </div>
  </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { formatPrice, formatNumber } from '~/utils/formatters'
import { useCartStore } from '~/stores/cart.store'
import { useUiStore }   from '~/stores/ui.store'
import { PRODUCT_PLACEHOLDER } from '~/utils/constants'

const props = defineProps({
  product: { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const router       = useRouter()
const cart         = useCartStore()
const ui           = useUiStore()
const imgError     = ref(false)
const addingToCart = ref(false)

const wholesaleVariant = computed(() =>
  (props.product.variants ?? []).find(v => v.wholesalePrice && v.wholesalePrice > 0 && v.isActive !== false)
)

const minQty  = computed(() => wholesaleVariant.value?.wholesaleMinQty || 10)
const savings = computed(() =>
  Math.max(0, (wholesaleVariant.value?.price ?? 0) - (wholesaleVariant.value?.wholesalePrice ?? 0))
)

const qty = ref(10)
watch(minQty, v => { qty.value = v }, { immediate: true })

const isInCart = computed(() =>
  cart.items.some(i => i.productId === props.product._id)
)

const imgSrc = computed(() => {
  if (imgError.value) return PRODUCT_PLACEHOLDER
  const p = props.product
  if (p.thumbnail) return p.thumbnail
  const img = p.images?.[0]
  if (!img) return PRODUCT_PLACEHOLDER
  return typeof img === 'string' ? img : (img.thumbnail || img.url || PRODUCT_PLACEHOLDER)
})

watch(() => props.product?._id, () => { imgError.value = false })

async function addToCart() {
  if (!wholesaleVariant.value) return
  addingToCart.value = true
  try {
    await cart.addItem(props.product._id, wholesaleVariant.value._id, qty.value)
    ui.addToast(`${formatNumber(qty.value)} عدد به سبد عمده افزوده شد`, 'success')
  } catch (e) {
    ui.addToast(e?.response?.data?.message || 'خطا در افزودن به سبد', 'error')
  } finally {
    addingToCart.value = false
  }
}

function goToProduct() {
  if (props.product.slug) router.push(`/product/${props.product.slug}`)
}
</script>
