<template>
  <div class="container-main py-8 min-h-[60vh]">

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-text-primary">
        سبد خرید
        <span v-if="cartStore.items.length" class="font-fanum text-text-secondary text-base font-normal mr-2">({{ formatNumber(cartStore.totalItems) }} کالا)</span>
      </h1>
      <template v-if="cartStore.items.length">
        <div v-if="confirmingClear" class="flex items-center gap-2 text-sm">
          <span class="text-text-secondary">پاک شود؟</span>
          <button @click="doClear" :disabled="clearing" class="text-error font-medium hover:underline disabled:opacity-50">بله</button>
          <button @click="confirmingClear = false" class="text-text-secondary hover:underline">خیر</button>
        </div>
        <button v-else @click="confirmingClear = true" class="text-sm text-text-secondary hover:text-error transition-colors">پاک کردن سبد</button>
      </template>
    </div>

    <div v-if="cartStore.loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 flex flex-col gap-4">
        <div v-for="i in 3" :key="i" class="h-32 rounded-2xl skeleton" />
      </div>
      <div class="h-72 rounded-2xl skeleton" />
    </div>

    <BaseEmpty
      v-else-if="!cartStore.items.length"
      icon="🛒"
      title="سبد خرید شما خالی است"
      subtitle="محصولات مورد علاقه‌تان را به سبد خرید اضافه کنید"
      action="مشاهده محصولات"
      to="/products"
    />

    <div v-else>

      <!-- Mixed cart warning -->
      <div v-if="cartStore.hasMixedCart"
           style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25);
                  border-radius:14px; padding:14px 18px; margin-bottom:24px;
                  display:flex; align-items:flex-start; gap:12px;">
        <span style="font-size:20px; flex-shrink:0;">⚠️</span>
        <div>
          <p style="font-weight:700; color:#b45309; margin-bottom:4px; font-size:14px;">سبد شما شامل هر دو نوع سفارش است</p>
          <p style="font-size:13px; color:var(--color-text-secondary); line-height:1.6;">
            آیتم‌های عمده و تکی باید جداگانه ثبت شوند. از دو دکمه پایین هر بخش برای ثبت سفارش استفاده کنید.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        <!-- Items column -->
        <div class="lg:col-span-2 flex flex-col gap-8">

          <!-- Wholesale section -->
          <div v-if="cartStore.hasWholesaleItems">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;
                        padding:8px 14px; border-radius:10px;
                        background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2);">
              <span style="font-size:16px;">🏪</span>
              <span style="font-weight:700; color:#b45309; font-size:15px;">سبد عمده</span>
              <span style="font-size:13px; color:#d97706; margin-right:4px;">({{ formatNumber(cartStore.wholesaleItems.reduce((s,i)=>s+i.quantity,0)) }} عدد)</span>
            </div>
            <TransitionGroup name="cart-item" tag="div" class="flex flex-col gap-4">
              <div
                v-for="item in cartStore.wholesaleItems"
                :key="`${item.productId}-${item.variantId}`"
                class="flex gap-4 p-4 rounded-2xl transition-all"
                style="background-color: var(--color-card); border:1px solid rgba(245,158,11,0.25);"
              >
                <NuxtLink v-if="item.slug" :to="`/product/${item.slug}`" class="flex-shrink-0">
                  <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl" @error="e => e.target.src = PLACEHOLDER" />
                </NuxtLink>
                <div v-else class="flex-shrink-0">
                  <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-24 h-24 object-cover rounded-xl" />
                </div>
                <div class="flex-1 min-w-0 flex flex-col gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <NuxtLink v-if="item.slug" :to="`/product/${item.slug}`" class="text-text-primary font-medium text-sm leading-6 hover:text-brand line-clamp-2 transition-colors">{{ item.name }}</NuxtLink>
                    <span v-else class="text-text-primary font-medium text-sm line-clamp-2">{{ item.name }}</span>
                    <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">🏪 قیمت عمده</span>
                  </div>
                  <div v-if="item.attributes?.length" class="flex flex-wrap gap-1.5">
                    <span v-for="attr in item.attributes" :key="attr.key" class="text-xs text-text-secondary bg-surface px-2 py-0.5 rounded-lg border border-surface-border">{{ attr.key }}: {{ attr.value }}</span>
                  </div>
                  <div class="flex items-center justify-between mt-auto flex-wrap gap-3 pt-1">
                    <div>
                      <div v-if="item.comparePrice > item.price" class="text-text-disabled line-through text-xs font-fanum leading-none mb-0.5">{{ formatPrice(item.comparePrice) }}</div>
                      <div class="text-text-primary font-bold font-fanum">{{ formatPrice(item.price) }}</div>
                      <div class="text-text-secondary text-xs font-fanum mt-0.5">جمع: {{ formatPrice(item.price * item.quantity) }}</div>
                    </div>
                    <div class="flex items-center gap-3">
                      <button @click="handleRemove(item)" :disabled="removingKey === itemKey(item)" class="text-text-disabled hover:text-error transition-colors disabled:opacity-50 p-1">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                      <div class="flex items-center border border-surface-border rounded-xl overflow-hidden">
                        <button @click="changeQty(item, item.quantity - 1)" :disabled="item.quantity <= 1 || updatingKey === itemKey(item)" class="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M20 12H4"/></svg>
                        </button>
                        <span class="w-10 text-center font-fanum text-sm font-bold text-text-primary select-none">{{ formatNumber(item.quantity) }}</span>
                        <button @click="changeQty(item, item.quantity + 1)" :disabled="item.quantity >= item.stock || updatingKey === itemKey(item)" class="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 4v16m8-8H4"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Retail section -->
          <div v-if="cartStore.hasRetailItems">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;
                        padding:8px 14px; border-radius:10px;
                        background:var(--color-surface); border:1px solid var(--color-border);">
              <span style="font-size:16px;">🛍️</span>
              <span style="font-weight:700; color:var(--color-text-primary); font-size:15px;">سبد خرده</span>
              <span style="font-size:13px; color:var(--color-text-secondary); margin-right:4px;">({{ formatNumber(cartStore.retailItems.reduce((s,i)=>s+i.quantity,0)) }} عدد)</span>
            </div>
            <TransitionGroup name="cart-item" tag="div" class="flex flex-col gap-4">
              <div
                v-for="item in cartStore.retailItems"
                :key="`${item.productId}-${item.variantId}`"
                class="flex gap-4 p-4 rounded-2xl border border-surface-border transition-all"
                style="background-color: var(--color-card)"
              >
                <NuxtLink v-if="item.slug" :to="`/product/${item.slug}`" class="flex-shrink-0">
                  <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl" @error="e => e.target.src = PLACEHOLDER" />
                </NuxtLink>
                <div v-else class="flex-shrink-0">
                  <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-24 h-24 object-cover rounded-xl" />
                </div>
                <div class="flex-1 min-w-0 flex flex-col gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <NuxtLink v-if="item.slug" :to="`/product/${item.slug}`" class="text-text-primary font-medium text-sm leading-6 hover:text-brand line-clamp-2 transition-colors">{{ item.name }}</NuxtLink>
                    <span v-else class="text-text-primary font-medium text-sm line-clamp-2">{{ item.name }}</span>
                  </div>
                  <div v-if="item.attributes?.length" class="flex flex-wrap gap-1.5">
                    <span v-for="attr in item.attributes" :key="attr.key" class="text-xs text-text-secondary bg-surface px-2 py-0.5 rounded-lg border border-surface-border">{{ attr.key }}: {{ attr.value }}</span>
                  </div>
                  <div class="flex items-center justify-between mt-auto flex-wrap gap-3 pt-1">
                    <div>
                      <div v-if="item.comparePrice > item.price" class="text-text-disabled line-through text-xs font-fanum leading-none mb-0.5">{{ formatPrice(item.comparePrice) }}</div>
                      <div class="text-text-primary font-bold font-fanum">{{ formatPrice(item.price) }}</div>
                      <div class="text-text-secondary text-xs font-fanum mt-0.5">جمع: {{ formatPrice(item.price * item.quantity) }}</div>
                    </div>
                    <div class="flex items-center gap-3">
                      <button @click="handleRemove(item)" :disabled="removingKey === itemKey(item)" class="text-text-disabled hover:text-error transition-colors disabled:opacity-50 p-1">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                      <div class="flex items-center border border-surface-border rounded-xl overflow-hidden">
                        <button @click="changeQty(item, item.quantity - 1)" :disabled="item.quantity <= 1 || updatingKey === itemKey(item)" class="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M20 12H4"/></svg>
                        </button>
                        <span class="w-10 text-center font-fanum text-sm font-bold text-text-primary select-none">{{ formatNumber(item.quantity) }}</span>
                        <button @click="changeQty(item, item.quantity + 1)" :disabled="item.quantity >= item.stock || updatingKey === itemKey(item)" class="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 4v16m8-8H4"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>

        </div>

        <!-- Summary column -->
        <div class="flex flex-col gap-4 lg:sticky lg:top-24">

          <!-- Wholesale summary -->
          <div v-if="cartStore.hasWholesaleItems"
               class="rounded-2xl p-5 flex flex-col gap-4"
               style="background:var(--color-card); border:1px solid rgba(245,158,11,0.3);">
            <h2 style="font-weight:700; font-size:15px; color:#b45309;
                       border-bottom:1px solid rgba(245,158,11,0.2); padding-bottom:12px;
                       display:flex; align-items:center; gap:6px;">
              <span>🏪</span> خلاصه سفارش عمده
            </h2>
            <div class="flex flex-col gap-3 text-sm">
              <div class="flex justify-between">
                <span style="color:var(--color-text-secondary)">تعداد</span>
                <span class="font-fanum" style="color:var(--color-text-primary)">{{ formatNumber(cartStore.wholesaleItems.reduce((s,i)=>s+i.quantity,0)) }} عدد</span>
              </div>
              <div v-if="wholesaleSavings > 0" class="flex justify-between" style="color:#16a34a;">
                <span>صرفه‌جویی</span>
                <span class="font-fanum">− {{ formatPrice(wholesaleSavings) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span style="color:var(--color-text-secondary)">ارسال</span>
                <span style="background:rgba(34,197,94,0.1); color:#16a34a; font-size:12px; font-weight:700; padding:2px 10px; border-radius:20px;">رایگان 🎁</span>
              </div>
            </div>
            <div style="border-top:1px solid rgba(245,158,11,0.2); padding-top:14px;">
              <div class="flex justify-between items-center">
                <span style="font-weight:700; color:var(--color-text-primary)">مبلغ قابل پرداخت</span>
                <span style="color:#b45309; font-size:1.2rem; font-weight:900;" class="font-fanum">{{ formatPrice(cartStore.wholesaleTotal) }}</span>
              </div>
            </div>
            <button
              @click="navigateTo('/checkout?type=wholesale')"
              style="width:100%; padding:14px; border-radius:12px; font-weight:700; font-size:15px;
                     border:none; cursor:pointer; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff;
                     transition:opacity 0.2s;"
              @mouseover="e=>e.currentTarget.style.opacity='0.9'"
              @mouseout="e=>e.currentTarget.style.opacity='1'"
            >ثبت سفارش عمده ←</button>
          </div>

          <!-- Retail summary -->
          <div v-if="cartStore.hasRetailItems"
               class="rounded-2xl border border-surface-border p-5 flex flex-col gap-4"
               style="background:var(--color-card);">
            <h2 class="font-bold text-text-primary text-base border-b border-surface-border pb-3">🛍️ خلاصه سفارش تکی</h2>
            <div class="flex flex-col gap-3 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">تعداد</span>
                <span class="font-fanum text-text-primary">{{ formatNumber(cartStore.retailItems.reduce((s,i)=>s+i.quantity,0)) }} عدد</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">قیمت اصلی</span>
                <span class="font-fanum text-text-primary">{{ formatPrice(cartStore.retailItems.reduce((s,i)=>s+(i.comparePrice||i.price)*i.quantity,0)) }}</span>
              </div>
              <div v-if="retailSavings > 0" class="flex justify-between text-success">
                <span>تخفیف</span>
                <span class="font-fanum">− {{ formatPrice(retailSavings) }}</span>
              </div>
            </div>
            <div class="border-t border-surface-border pt-4">
              <div class="flex justify-between items-center">
                <span class="font-bold text-text-primary">مبلغ قابل پرداخت</span>
                <span class="text-brand text-xl font-black font-fanum">{{ formatPrice(cartStore.retailTotal) }}</span>
              </div>
            </div>
            <BaseButton variant="primary" block size="lg" @click="navigateTo('/checkout?type=retail')">ادامه و پرداخت ←</BaseButton>
          </div>

          <NuxtLink to="/products" class="text-center text-sm text-brand hover:underline block">← ادامه خرید</NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { formatPrice, formatNumber } from '~/utils/formatters'
import BaseEmpty   from '~/components/common/BaseEmpty.vue'
import BaseButton  from '~/components/common/BaseButton.vue'

definePageMeta({ layout: 'default' })

useSeoMeta({ title: 'سبد خرید', robots: 'noindex' })

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="%23e2e8f0"%3E%3Crect width="96" height="96"/%3E%3C/svg%3E'

const cartStore = useCartStore()
const ui        = useUiStore()

const updatingKey     = ref(null)
const removingKey     = ref(null)
const clearing        = ref(false)
const confirmingClear = ref(false)

const subtotal         = computed(() => cartStore.items.reduce((s, i) => { const base = i.comparePrice > i.price ? i.comparePrice : i.price; return s + base * i.quantity }, 0))
const savings          = computed(() => subtotal.value - cartStore.totalPrice)
const retailSavings    = computed(() => cartStore.retailItems.reduce((s, i) => s + Math.max(0, (i.comparePrice - i.price) * i.quantity), 0))
const wholesaleSavings = computed(() => cartStore.wholesaleItems.reduce((s, i) => s + Math.max(0, (i.comparePrice - i.price) * i.quantity), 0))

function itemKey(item) { return `${item.productId}-${item.variantId}` }

async function changeQty(item, newQty) {
  if (newQty < 1 || newQty > item.stock) return
  const key = itemKey(item)
  if (updatingKey.value === key) return
  updatingKey.value = key
  try { await cartStore.updateItem(item.productId, item.variantId, newQty) }
  catch { ui.addToast('خطا در بروزرسانی تعداد', 'error') }
  finally { updatingKey.value = null }
}

async function handleRemove(item) {
  const key = itemKey(item)
  if (removingKey.value === key) return
  removingKey.value = key
  try { await cartStore.removeItem(item.productId, item.variantId); ui.addToast('کالا از سبد حذف شد', 'success') }
  catch { ui.addToast('خطا در حذف کالا', 'error') }
  finally { removingKey.value = null }
}

async function doClear() {
  clearing.value = true
  try { await cartStore.clearCart(); confirmingClear.value = false; ui.addToast('سبد خرید پاک شد', 'success') }
  catch { ui.addToast('خطا در پاک کردن سبد', 'error') }
  finally { clearing.value = false }
}

onMounted(() => cartStore.fetchCart())
</script>

<style scoped>
.cart-item-enter-active, .cart-item-leave-active { transition: all 0.3s ease; }
.cart-item-enter-from { opacity: 0; transform: translateX(20px); }
.cart-item-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
