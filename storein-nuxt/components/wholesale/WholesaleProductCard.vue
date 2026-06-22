<template>
  <!-- Skeleton -->
  <div v-if="loading" class="rounded-2xl shadow-card overflow-hidden" style="background-color: var(--color-card);">
    <div class="aspect-square" style="background-color: var(--color-surface, #f3f4f6);" />
    <div class="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
      <div class="h-3 sm:h-4 rounded" style="background-color: var(--color-surface, #f3f4f6);" />
      <div class="h-3 sm:h-4 rounded w-3/4" style="background-color: var(--color-surface, #f3f4f6);" />
      <div class="h-16 sm:h-20 rounded" style="background-color: var(--color-surface, #f3f4f6);" />
      <div class="h-9 sm:h-10 rounded" style="background-color: var(--color-surface, #f3f4f6);" />
    </div>
  </div>

  <!-- Wholesale card -->
  <article
    v-else
    class="rounded-2xl shadow-card overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col h-full"
    style="background-color: var(--color-card);"
    @click="goToProduct"
  >
    <!-- Image -->
    <div class="aspect-square relative shrink-0 overflow-hidden p-1.5 sm:p-3" style="background-color: var(--color-card);">
      <div class="absolute top-1.5 start-1.5 sm:top-2 sm:start-2 z-10">
        <span
          class="text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full"
          style="background: rgba(245,158,11,0.15); color: #b45309; border: 1px solid rgba(245,158,11,0.3);"
        >🏪 عمده</span>
      </div>
      <img
        :src="imgSrc"
        :alt="product.name"
        class="w-full h-full object-contain"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-if="product.totalStock === 0" class="absolute inset-0 bg-white/75 flex items-center justify-center">
        <span class="text-gray-700 font-semibold text-xs px-2 py-1 bg-white rounded-full shadow-sm">ناموجود</span>
      </div>
    </div>

    <!-- Body -->
    <div class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 flex-1">

      <!-- Name -->
      <h3
        class="font-bold line-clamp-2 leading-relaxed"
        style="color: var(--color-text-primary); font-size: clamp(11px, 3vw, 14px); min-height: 2.4em;"
      >
        {{ product.name }}
      </h3>

      <!-- Price block -->
      <div
        v-if="wholesaleVariant"
        class="rounded-xl"
        style="background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.2); padding: clamp(6px, 2vw, 10px) clamp(8px, 2.5vw, 12px);"
      >
        <!-- Wholesale price row -->
        <div class="flex items-baseline justify-between mb-0.5 sm:mb-1">
          <span style="font-size: clamp(9px, 2.3vw, 11px); color: var(--color-text-secondary);">قیمت عمده</span>
          <span
            class="font-bold font-fanum"
            style="font-size: clamp(12px, 3.5vw, 17px); color: #b45309; line-height: 1.3;"
          >{{ formatPrice(wholesaleVariant.wholesalePrice) }}</span>
        </div>

        <!-- Retail price row -->
        <div class="flex items-baseline justify-between mb-1.5 sm:mb-2">
          <span style="font-size: clamp(9px, 2.3vw, 11px); color: var(--color-text-secondary);">قیمت تکی</span>
          <span
            class="font-fanum"
            style="font-size: clamp(10px, 2.8vw, 13px); text-decoration: line-through; color: var(--color-text-secondary);"
          >{{ formatPrice(wholesaleVariant.price) }}</span>
        </div>

        <!-- Divider -->
        <div style="border-top: 1px solid rgba(245,158,11,0.2); margin-bottom: 6px;" />

        <!-- Savings + MinQty — stacks on very small cards -->
        <div class="flex flex-wrap items-center justify-between gap-1">
          <span
            class="font-bold font-fanum"
            style="font-size: clamp(9px, 2.3vw, 11px); color: #16a34a;
                   background: rgba(34,197,94,0.1); padding: 2px 6px;
                   border-radius: 20px;"
          >{{ formatPrice(savings) }} ارزان‌تر</span>
          <span
            class="font-bold font-fanum"
            style="font-size: clamp(9px, 2.3vw, 11px); color: #b45309;
                   background: rgba(245,158,11,0.15); padding: 2px 6px;
                   border-radius: 20px; border: 1px solid rgba(245,158,11,0.25);"
          >حداقل {{ formatNumber(minQty) }} عدد</span>
        </div>
      </div>

      <!-- Fallback: no wholesale price -->
      <div v-else class="text-xs text-center py-3" style="color: var(--color-text-secondary);">
        قیمت عمده تعیین نشده
      </div>

      <!-- Bottom: qty stepper + add to cart -->
      <div v-if="wholesaleVariant" class="flex flex-col gap-1 mt-auto" @click.stop>
        <div class="flex gap-1.5 sm:gap-2">

          <!-- Qty stepper -->
          <div
            class="flex items-center border rounded-xl overflow-hidden shrink-0"
            :style="{ borderColor: qtyExceedsStock ? '#dc2626' : 'var(--color-border)', background: 'var(--color-bg)' }"
          >
            <button
              type="button"
              class="flex items-center justify-center font-bold transition-colors hover:bg-surface"
              style="width: clamp(24px, 7vw, 32px); height: clamp(32px, 9vw, 40px); font-size: clamp(14px, 4vw, 18px); color: var(--color-text-primary);"
              @click="qty = Math.max(minQty, qty - minQty)"
            >−</button>
            <input
              type="number"
              v-model.number="qty"
              @change="onQtyChange"
              @blur="onQtyChange"
              class="qty-input font-bold font-fanum text-center bg-transparent border-none outline-none"
              style="min-width: clamp(28px, 8vw, 40px); width: clamp(28px, 8vw, 40px); font-size: clamp(10px, 2.8vw, 13px); color: var(--color-text-primary);"
              :min="minQty"
            />
            <button
              type="button"
              class="flex items-center justify-center font-bold transition-colors hover:bg-surface"
              style="width: clamp(24px, 7vw, 32px); height: clamp(32px, 9vw, 40px); font-size: clamp(14px, 4vw, 18px); color: var(--color-text-primary);"
              @click="qty += minQty"
            >+</button>
          </div>

          <!-- Add to cart -->
          <button
            type="button"
            class="flex-1 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style="padding: clamp(6px, 2vw, 10px) 4px; font-size: clamp(10px, 2.8vw, 13px);
                   background: linear-gradient(135deg, #f59e0b, #d97706); min-height: clamp(32px, 9vw, 40px);"
            :disabled="product.totalStock === 0 || addingToCart || qtyExceedsStock"
            @click.stop="addToCart"
          >
            <span v-if="addingToCart" class="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span v-else>{{ isInCart ? '✓ در سبد' : 'افزودن به سبد' }}</span>
          </button>

        </div>

        <!-- Stock warning -->
        <p
          v-if="qtyExceedsStock"
          style="font-size: clamp(9px, 2.2vw, 11px); color: #dc2626; text-align: center; font-weight: 600;"
        >فقط {{ wholesaleVariant.stock }} عدد موجود است</p>

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

const qtyExceedsStock = computed(() => {
  const stock = wholesaleVariant.value?.stock ?? Infinity
  return qty.value > stock
})

function onQtyChange() {
  const stock = wholesaleVariant.value?.stock ?? Infinity
  if (!qty.value || qty.value < minQty.value) qty.value = minQty.value
  else if (qty.value > stock) qty.value = stock
}

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

<style scoped>
.qty-input::-webkit-inner-spin-button,
.qty-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.qty-input { -moz-appearance: textfield; appearance: textfield; }
</style>
