<template>
  <!-- Skeleton -->
  <div v-if="loading" class="rounded-2xl overflow-hidden shadow-card animate-pulse" style="background: var(--color-card);">
    <div class="aspect-square" style="background: var(--color-surface);"/>
    <div class="p-3 space-y-2.5">
      <div class="h-3.5 rounded-lg w-4/5" style="background: var(--color-surface);"/>
      <div class="h-3 rounded-lg w-3/5" style="background: var(--color-surface);"/>
      <div class="h-20 rounded-xl mt-2" style="background: var(--color-surface);"/>
      <div class="h-9 rounded-xl" style="background: var(--color-surface);"/>
    </div>
  </div>

  <!-- Card -->
  <article
    v-else
    class="group rounded-2xl overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-250 flex flex-col h-full cursor-pointer"
    style="background: var(--color-card);"
    @click="goToProduct"
  >
    <!-- ── Image area ── -->
    <div class="relative aspect-square shrink-0 overflow-hidden" style="background: var(--color-surface);">

      <!-- Savings badge — top start -->
      <div v-if="savingsPct > 0"
           class="absolute top-2.5 start-2.5 z-10 flex flex-col gap-1">
        <span class="text-[11px] font-black px-2 py-0.5 rounded-full text-white leading-tight"
              style="background: linear-gradient(135deg, #16a34a, #15803d); box-shadow: 0 2px 8px rgba(22,163,74,0.35);">
          ↓{{ savingsPct }}٪
        </span>
      </div>

      <!-- Wholesale badge — top end -->
      <div class="absolute top-2.5 end-2.5 z-10">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight"
              style="background: rgba(245,158,11,0.14); color: #b45309; border: 1px solid rgba(245,158,11,0.3);">
          🏪 عمده
        </span>
      </div>

      <img
        :src="imgSrc"
        :alt="product.name"
        class="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        @error="imgError = true"
      />

      <!-- Out of stock overlay -->
      <div v-if="product.totalStock === 0"
           class="absolute inset-0 flex items-center justify-center"
           style="background: rgba(255,255,255,0.8);">
        <span class="text-gray-600 font-bold text-xs px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-200">
          ناموجود
        </span>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="flex flex-col gap-2.5 p-3 sm:p-4 flex-1">

      <!-- Product name -->
      <h3 class="font-bold leading-relaxed text-text-primary line-clamp-2"
          style="font-size: clamp(11px, 2.8vw, 13px); min-height: 2.5em;">
        {{ product.name }}
      </h3>

      <!-- Price block -->
      <div v-if="wholesaleVariant" class="rounded-xl overflow-hidden"
           style="background: linear-gradient(135deg, rgba(245,158,11,0.07), rgba(217,119,6,0.04)); border: 1px solid rgba(245,158,11,0.22);">

        <!-- Wholesale price row -->
        <div class="flex items-baseline justify-between px-3 pt-2.5 pb-1">
          <span class="text-[10px] font-bold"
                style="color: #92400e; background: rgba(245,158,11,0.12); padding: 2px 7px; border-radius: 20px;">
            قیمت عمده
          </span>
          <span class="font-black font-fanum"
                style="font-size: clamp(13px, 3.5vw, 17px); color: #b45309; line-height: 1.2;">
            {{ formatPrice(wholesaleVariant.wholesalePrice) }}
          </span>
        </div>

        <!-- Divider -->
        <div class="mx-3 h-px" style="background: rgba(245,158,11,0.15);"/>

        <!-- Retail + savings row -->
        <div class="flex items-center justify-between px-3 py-2">
          <span class="font-fanum text-[10px]"
                style="color: var(--color-text-secondary); text-decoration: line-through;">
            {{ formatPrice(wholesaleVariant.price) }}
          </span>
          <span v-if="savings > 0"
                class="font-bold font-fanum text-[10px] px-2 py-0.5 rounded-full"
                style="background: rgba(22,163,74,0.1); color: #15803d;">
            {{ formatPrice(savings) }} ارزان‌تر
          </span>
        </div>

        <!-- Min qty badge -->
        <div class="px-3 pb-2.5">
          <span class="inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-1 rounded-full w-full justify-center"
                style="background: rgba(245,158,11,0.1); color: #92400e; border: 1px solid rgba(245,158,11,0.2);">
            <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
            </svg>
            حداقل {{ formatNumber(minQty) }} عدد در هر سفارش
          </span>
        </div>
      </div>

      <!-- No wholesale price fallback -->
      <div v-else class="rounded-xl py-4 text-center text-xs"
           style="background: var(--color-surface); color: var(--color-text-secondary);">
        قیمت عمده تعیین نشده
      </div>

      <!-- ── Qty stepper + Add to cart ── -->
      <div v-if="wholesaleVariant" class="flex gap-2 mt-auto" @click.stop>

        <!-- Stepper -->
        <div class="flex items-center rounded-xl overflow-hidden border shrink-0"
             :style="{
               borderColor: qtyExceedsStock ? '#dc2626' : 'var(--color-border)',
               background: 'var(--color-bg)'
             }">
          <button
            type="button"
            class="flex items-center justify-center font-bold hover:bg-surface transition-colors"
            style="width: clamp(26px, 7vw, 32px); height: clamp(34px, 9vw, 40px); font-size: 16px; color: var(--color-text-primary);"
            @click="qty = Math.max(minQty, qty - minQty)"
            :disabled="qty <= minQty"
            aria-label="کاهش تعداد"
          >−</button>
          <input
            type="number"
            v-model.number="qty"
            @change="onQtyChange"
            @blur="onQtyChange"
            class="qty-input font-bold font-fanum text-center bg-transparent border-none outline-none"
            style="width: clamp(30px, 8vw, 40px); font-size: clamp(10px, 2.5vw, 12px); color: var(--color-text-primary);"
            :min="minQty"
            aria-label="تعداد"
          />
          <button
            type="button"
            class="flex items-center justify-center font-bold hover:bg-surface transition-colors"
            style="width: clamp(26px, 7vw, 32px); height: clamp(34px, 9vw, 40px); font-size: 16px; color: var(--color-text-primary);"
            @click="qty += minQty"
            aria-label="افزایش تعداد"
          >+</button>
        </div>

        <!-- Add to cart button -->
        <button
          type="button"
          class="flex-1 rounded-xl font-bold text-white transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          style="font-size: clamp(10px, 2.5vw, 12px); min-height: clamp(34px, 9vw, 40px); background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 3px 10px rgba(245,158,11,0.3);"
          :disabled="product.totalStock === 0 || addingToCart || qtyExceedsStock"
          @click.stop="addToCart"
        >
          <svg v-if="addingToCart" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else-if="isInCart" class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
          </svg>
          <span>{{ isInCart ? 'در سبد' : 'افزودن' }}</span>
        </button>

      </div>

      <!-- Stock warning -->
      <p v-if="qtyExceedsStock" class="text-center font-semibold"
         style="font-size: 10px; color: #dc2626;">
        فقط {{ wholesaleVariant.stock }} عدد موجود است
      </p>

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
  (props.product.variants ?? []).find(v => v.wholesalePrice && v.wholesalePrice > 0 && v.isActive !== false),
)

const minQty    = computed(() => wholesaleVariant.value?.wholesaleMinQty || 10)
const savings   = computed(() => Math.max(0, (wholesaleVariant.value?.price ?? 0) - (wholesaleVariant.value?.wholesalePrice ?? 0)))
const savingsPct = computed(() => {
  const wv = wholesaleVariant.value
  if (!wv?.price || !wv?.wholesalePrice) return 0
  return Math.round((1 - wv.wholesalePrice / wv.price) * 100)
})

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

const isInCart = computed(() => cart.items.some(i => i.productId === props.product._id))

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
