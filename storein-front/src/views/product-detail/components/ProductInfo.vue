<template>
  <div class="flex flex-col gap-5">

    <!-- SKELETON -->
    <template v-if="loading">
      <BaseSkeleton height="2rem" class="w-3/4" />
      <BaseSkeleton height="1rem" class="w-1/2" />
      <div class="border-t border-surface-border pt-4">
        <BaseSkeleton height="1rem" class="w-1/4 mb-3" />
        <div class="flex gap-2">
          <BaseSkeleton v-for="i in 3" :key="i" width="36px" height="36px" circle />
        </div>
      </div>
      <BaseSkeleton height="2.5rem" class="w-full rounded-xl" />
      <BaseSkeleton height="3rem" class="w-full rounded-xl" />
    </template>

    <!-- REAL CONTENT -->
    <template v-else-if="product">

      <!-- ① Name + category -->
      <div>
        <RouterLink
          :to="{ name: 'category', params: { slug: product.category?.slug } }"
          class="text-brand text-xs font-medium hover:underline mb-1 block"
        >
          {{ product.category?.name }}
        </RouterLink>
        <h1 class="text-xl md:text-2xl font-bold text-text-primary leading-8">
          {{ product.name }}
        </h1>
      </div>

      <!-- ② Rating row -->
      <div class="flex items-center gap-3 pb-4 border-b border-surface-border">
        <BaseRating
          :modelValue="product.avgRating || 0"
          readonly
          showValue
          :count="product.reviewCount"
          size="md"
        />
        <span class="text-text-disabled text-sm">|</span>
        <span class="text-text-secondary text-sm font-fanum">
          {{ formatNumber(product.viewCount || 0) }} بازدید
        </span>
      </div>

      <!-- ③ Variant color swatches -->
      <div v-if="colorVariants.length > 0" class="pb-4 border-b border-surface-border">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-sm font-medium text-text-primary">رنگ:</span>
          <span class="text-sm text-brand font-medium">
            {{ selectedVariant?.attributes?.['رنگ'] || '' }}
          </span>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="variant in colorVariants"
            :key="variant._id"
            @click="selectVariant(variant)"
            :disabled="variant.stock === 0"
            :class="[
              'flex flex-col items-center gap-1 transition-all duration-150',
              variant.stock === 0 ? 'opacity-40 cursor-not-allowed' : '',
            ]"
          >
            <span
              :class="[
                'w-9 h-9 rounded-full border-2 flex items-center justify-center relative transition-all',
                selectedVariant?._id === variant._id
                  ? 'border-brand scale-110 shadow-md'
                  : 'border-transparent hover:border-gray-300',
              ]"
            >
              <span
                class="w-7 h-7 rounded-full border border-black/10 block"
                :style="{ backgroundColor: getColorHex(variant.attributes?.['رنگ']) }"
              />
              <span v-if="variant.stock === 0" class="absolute inset-0 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-error" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </span>
            </span>
            <span class="text-xs text-text-secondary leading-none">
              {{ variant.attributes?.['رنگ'] }}
            </span>
          </button>
        </div>
      </div>

      <!-- ④ Price -->
      <div class="pb-4 border-b border-surface-border">
        <template v-if="selectedVariant?.comparePrice > selectedVariant?.price">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-text-disabled line-through text-sm font-fanum">
              {{ formatPrice(selectedVariant.comparePrice) }}
            </span>
            <BaseBadge variant="red" size="sm">{{ discountPercent }}٪ تخفیف</BaseBadge>
          </div>
          <div class="text-2xl font-black text-text-primary font-fanum">
            {{ formatPrice(selectedVariant?.price || product.minPrice) }}
          </div>
        </template>
        <template v-else>
          <div class="text-2xl font-black text-text-primary font-fanum">
            {{ formatPrice(selectedVariant?.price || product.minPrice) }}
          </div>
        </template>
      </div>

      <!-- ⑤ Stock status -->
      <div class="flex items-center gap-2">
        <template v-if="isInStock">
          <div class="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
          <span class="text-success text-sm font-medium">موجود در انبار</span>
          <span v-if="selectedVariant?.stock > 0 && selectedVariant?.stock <= 5" class="text-warning text-xs font-fanum">
            (تنها {{ selectedVariant.stock }} عدد باقی‌مانده)
          </span>
        </template>
        <template v-else>
          <div class="w-2.5 h-2.5 rounded-full bg-error flex-shrink-0" />
          <span class="text-error text-sm font-medium">ناموجود</span>
        </template>
      </div>

      <!-- ⑥ Action buttons -->
      <div ref="cartButtonRef" class="flex flex-col gap-3">
        <BaseButton
          variant="primary"
          size="lg"
          block
          :loading="addingToCart"
          :disabled="!isInStock"
          @click="handleAddToCart"
        >
          <template v-if="isInStock">
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            افزودن به سبد خرید
          </template>
          <template v-else>ناموجود</template>
        </BaseButton>

        <button
          @click="handleWishlist"
          :class="[
            'w-full py-3 rounded-xl border-2 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200',
            isWishlisted
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-surface-border text-text-secondary hover:border-brand/50',
          ]"
        >
          <svg
            class="w-5 h-5"
            :fill="isWishlisted ? 'currentColor' : 'none'"
            :stroke="isWishlisted ? 'none' : 'currentColor'"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          {{ isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها' }}
        </button>
      </div>

      <!-- ⑦ Guarantees -->
      <div class="grid grid-cols-3 gap-3 pt-2">
        <div
          v-for="g in guarantees"
          :key="g.icon"
          class="flex flex-col items-center gap-1.5 text-center"
        >
          <div class="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
            <span class="text-xl">{{ g.icon }}</span>
          </div>
          <span class="text-text-secondary text-xs leading-4">{{ g.label }}</span>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCartStore }     from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useUiStore }       from '@/stores/ui.store'
import { formatPrice, formatNumber, calcDiscount } from '@/utils/formatters'
import { colorService } from '@/services/color.service'
import BaseRating   from '@/components/common/BaseRating.vue'
import BaseBadge    from '@/components/common/BaseBadge.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'

const props = defineProps({
  product: { type: Object,  default: null },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['add-to-cart', 'variant-change'])

const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()

const addingToCart  = ref(false)
const cartButtonRef = ref(null)

// ── Variants ──────────────────────────────────────────────────────
const colorVariants  = computed(() => props.product?.variants ?? [])
const selectedVariant = ref(null)

watch(() => props.product, (p) => {
  if (p?.variants?.length) selectedVariant.value = p.variants[0]
}, { immediate: true })

function selectVariant(variant) {
  if (variant.stock === 0) return
  selectedVariant.value = variant
  emit('variant-change', variant)
}

// ── Price / discount ──────────────────────────────────────────────
const discountPercent = computed(() => {
  const v = selectedVariant.value
  if (!v?.comparePrice || !v?.price) return 0
  return calcDiscount(v.comparePrice, v.price)
})

// ── Stock ─────────────────────────────────────────────────────────
const isInStock = computed(() =>
  selectedVariant.value
    ? selectedVariant.value.stock > 0
    : (props.product?.totalStock ?? 0) > 0
)

// ── Wishlist ──────────────────────────────────────────────────────
const isWishlisted = computed(() =>
  props.product ? wishlistStore.isInWishlist(props.product._id) : false
)

async function handleWishlist() {
  if (!props.product) return
  await wishlistStore.toggle(props.product._id)
}

// ── Add to cart ───────────────────────────────────────────────────
async function handleAddToCart() {
  if (!isInStock.value || addingToCart.value) return
  addingToCart.value = true
  try {
    await cartStore.addItem(props.product._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد ✓', 'success')
    emit('add-to-cart', selectedVariant.value?._id)
  } catch {
    ui.addToast('خطا در افزودن به سبد. دوباره تلاش کنید', 'error')
  } finally {
    addingToCart.value = false
  }
}

// ── Colors from API ───────────────────────────────────────────────
const colorsFromApi = ref([])

onMounted(async () => {
  try {
    const { data } = await colorService.getActive()
    colorsFromApi.value = Array.isArray(data) ? data : []
  } catch { /* silent */ }
})

function getColorHex(name) {
  if (!name) return '#888'
  const found = colorsFromApi.value.find(c => c.name === name)
  return found?.hex ?? '#888'
}

const guarantees = [
  { icon: '🔒', label: 'پرداخت امن' },
  { icon: '↩️', label: 'ضمانت ۷ روزه' },
  { icon: '✅', label: 'اصالت کالا' },
]

defineExpose({ cartButtonRef })
</script>
