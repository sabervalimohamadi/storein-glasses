<template>
  <div class="min-h-screen" style="background: var(--color-bg);">

    <!-- Hero -->
    <section class="py-16 px-4 text-center" style="background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark, #1a4fbd) 100%);">
      <div class="max-w-3xl mx-auto text-white">
        <div class="text-5xl mb-4">🏪</div>
        <h1 class="text-3xl md:text-4xl font-black mb-3">فروش عمده استورین</h1>
        <p class="text-lg text-white/80 mb-8">قیمت‌های ویژه · حداقل سفارش مشخص · پشتیبانی اختصاصی B2B</p>
        <div class="flex flex-wrap justify-center gap-6 text-sm text-white/90">
          <div class="flex items-center gap-2">
            <span class="text-xl">💰</span>
            <span>تا ۳۰٪ تخفیف نسبت به قیمت خرده</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xl">🚚</span>
            <span>ارسال رایگان برای سفارش‌های عمده</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xl">🤝</span>
            <span>پشتیبانی اختصاصی B2B</span>
          </div>
        </div>
      </div>
    </section>

    <div class="max-w-6xl mx-auto px-4 py-12">

      <!-- حالت ۱: وارد نشده -->
      <div v-if="!auth.isLoggedIn" class="text-center py-10">
        <div class="text-5xl mb-4">🔐</div>
        <h2 class="text-xl font-bold mb-3" style="color: var(--color-text-primary);">
          برای ثبت درخواست عمده وارد شوید
        </h2>
        <p class="text-sm mb-6" style="color: var(--color-text-secondary);">
          ابتدا با شماره موبایل خود وارد شوید، سپس فرم درخواست را تکمیل کنید.
        </p>
        <NuxtLink
          to="/auth/login?redirect=/wholesale"
          class="inline-block bg-brand text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          ورود / ثبت‌نام
        </NuxtLink>
      </div>

      <!-- حالت ۲: تأیید شده -->
      <div v-else-if="wholesaleStatus?.isWholesale">
        <div class="text-center py-10">
          <div class="text-5xl mb-4">✅</div>
          <h2 class="text-xl font-bold mb-3 text-green-600">حساب عمده شما فعال است</h2>
          <p v-if="wholesaleStatus.companyName" class="text-sm mb-1" style="color: var(--color-text-secondary);">
            شرکت: <strong>{{ wholesaleStatus.companyName }}</strong>
          </p>
          <p v-if="wholesaleStatus.approvedAt" class="text-sm mb-6" style="color: var(--color-text-secondary);">
            از تاریخ {{ formatDate(wholesaleStatus.approvedAt) }} تأیید شده‌اید
          </p>
        </div>

        <!-- Product listing -->
        <div class="mt-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold" style="color: var(--color-text-primary);">
              محصولات عمده‌فروشی
            </h2>
            <span class="text-sm" style="color: var(--color-text-secondary);">
              قیمت‌های ویژه فقط برای شما
            </span>
          </div>
          <WholesaleProductGrid :products="wholesaleProducts" :loading="productsLoading" />
        </div>
      </div>

      <!-- حالت ۳: در انتظار بررسی -->
      <div v-else-if="wholesaleStatus?.status === 'pending'" class="text-center py-10">
        <div class="text-5xl mb-4">⏳</div>
        <h2 class="text-xl font-bold mb-3" style="color: var(--color-text-primary);">
          درخواست شما در حال بررسی است
        </h2>
        <p class="text-sm" style="color: var(--color-text-secondary);">
          معمولاً تا ۲۴ ساعت کاری نتیجه از طریق پیامک اطلاع‌رسانی می‌شود.
        </p>
      </div>

      <!-- حالت ۴: رد شده -->
      <div v-else-if="wholesaleStatus?.status === 'rejected'">
        <div class="rounded-xl p-4 bg-red-50 border border-red-200 mb-6">
          <p class="text-red-700 font-semibold mb-1">درخواست قبلی رد شد</p>
          <p class="text-red-600 text-sm">{{ wholesaleStatus.rejectedReason || 'اطلاعات کافی ارائه نشده بود.' }}</p>
        </div>
        <h2 class="text-lg font-bold mb-4 text-center" style="color: var(--color-text-primary);">
          ارسال مجدد درخواست
        </h2>
        <WholesaleRequestForm @submitted="onSubmitted" />
      </div>

      <!-- حالت ۵: فرم اولیه -->
      <div v-else-if="auth.isLoggedIn">
        <h2 class="text-xl font-bold mb-6 text-center" style="color: var(--color-text-primary);">
          فرم درخواست عمده‌فروشی
        </h2>
        <WholesaleRequestForm @submitted="onSubmitted" />
      </div>

    </div>
  </div>
</template>

<script setup>
import WholesaleRequestForm from '~/components/wholesale/WholesaleRequestForm.vue'
import WholesaleProductGrid from '~/components/wholesale/WholesaleProductGrid.vue'
import { useAuthStore } from '~/stores/auth.store'
import http from '~/services/http.service'

definePageMeta({ layout: 'default' })
useSeoMeta({
  title:       'فروش عمده | استورین',
  description: 'ثبت درخواست عمده‌فروشی و خرید عینک با قیمت ویژه عمده',
})

const auth             = useAuthStore()
const wholesaleStatus  = ref(null)
const wholesaleProducts = ref([])
const productsLoading   = ref(false)

async function fetchWholesaleProducts() {
  productsLoading.value = true
  try {
    const { data } = await http.get('/products', {
      params: { status: 'active', hasWholesalePrice: true, limit: 24 },
    })
    wholesaleProducts.value = data?.items ?? data?.products ?? []
  } catch {}
  finally { productsLoading.value = false }
}

onMounted(async () => {
  if (!auth.isLoggedIn) return
  try {
    const { data } = await http.get('/users/me/wholesale-status')
    wholesaleStatus.value = data
    if (data?.isWholesale) fetchWholesaleProducts()
  } catch {}
})

watch(() => wholesaleStatus.value?.isWholesale, (approved) => {
  if (approved) fetchWholesaleProducts()
})

function onSubmitted() {
  wholesaleStatus.value = { status: 'pending' }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fa-IR')
}
</script>
