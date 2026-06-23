<template>
  <div class="bg-bg min-h-screen">

    <!-- ═══════════════════════════════════════════════════════════
         HERO SECTION — shown to all users
    ══════════════════════════════════════════════════════════════ -->
    <section class="bg-gradient-to-br from-[#1e3a5f] to-[#0f1f35] px-4 pt-16 pb-12 text-center relative overflow-hidden">

      <!-- Subtle grid pattern overlay -->
      <div class="absolute inset-0 opacity-[0.04] pointer-events-none"
           style="background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:40px 40px;" aria-hidden="true" />

      <div class="max-w-3xl mx-auto relative">

        <!-- Badge -->
        <div class="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold px-3.5 py-1 rounded-full mb-5">
          <span>B2B</span>
          <span class="opacity-50">|</span>
          <span>فروش عمده</span>
        </div>

        <h1 class="text-3xl md:text-[clamp(1.8rem,5vw,2.8rem)] font-black text-white mb-3 leading-tight">
          فروش عمده {{ settingsStore.siteName }}
        </h1>
        <p class="text-white/70 text-base mb-10">
          قیمت‌های ویژه · حداقل سفارش مشخص · پشتیبانی اختصاصی B2B
        </p>

        <!-- 3 feature cards (responsive: 1-col on mobile, 3-col from sm) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto w-full">
          <div v-for="f in features" :key="f.label"
               class="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <component :is="f.icon" class="w-7 h-7 mx-auto mb-2 text-amber-300" aria-hidden="true" />
            <div class="text-white text-sm font-semibold leading-snug">{{ f.label }}</div>
            <div class="text-white/50 text-xs mt-1">{{ f.sub }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         STATUS BAR — only for approved users (compact)
    ══════════════════════════════════════════════════════════════ -->
    <div v-if="wholesaleStatus?.isWholesale"
         class="bg-success/5 border-b border-success/20 px-5 py-2.5 flex items-center justify-center gap-3 flex-wrap">
      <span class="inline-flex items-center gap-1.5 bg-success/15 text-success text-xs font-bold px-2.5 py-0.5 rounded-full">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        حساب عمده فعال
      </span>
      <span v-if="wholesaleStatus.companyName" class="text-sm text-text-secondary">
        شرکت: <strong class="text-text-primary">{{ wholesaleStatus.companyName }}</strong>
      </span>
      <span v-if="wholesaleStatus.approvedAt" class="text-xs text-text-secondary">
        تأیید: {{ formatDate(wholesaleStatus.approvedAt) }}
      </span>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         LAYOUT A: APPROVED USER — full catalog + filters
    ══════════════════════════════════════════════════════════════ -->
    <div v-if="wholesaleStatus?.isWholesale" class="container-main py-5">

      <div class="flex gap-5 items-start">

        <!-- Filter sidebar (desktop) -->
        <div class="hidden lg:block sticky top-20 self-start">
          <FilterSidebar :filters="filters" @change="onFilterChange" />
        </div>

        <!-- Main content -->
        <div class="flex-1 min-w-0">

          <!-- SortBar -->
          <SortBar
            v-model="filters.sortBy"
            :total="total"
            :loading="productsLoading"
            @update:modelValue="onSortChange"
            @open-filter="mobileFilterOpen = true"
          />

          <!-- Active filters chips -->
          <ActiveFilters
            :filters="filters"
            @remove="removeFilter"
            @clear-all="clearAllFilters"
          />

          <!-- Wholesale product grid -->
          <WholesaleProductGrid
            :products="wholesaleProducts"
            :loading="productsLoading"
          />

          <!-- Pagination -->
          <BasePagination
            :model-value="page"
            :total-pages="totalPages"
            :loading="productsLoading"
            @update:modelValue="onPageChange"
            class="mt-6"
          />
        </div>
      </div>

      <!-- Mobile filter drawer -->
      <FilterMobileDrawer
        v-model="mobileFilterOpen"
        :filters="filters"
        @apply="onMobileFilterApply"
        @clear="clearAllFilters"
      />
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         LAYOUT B: NON-APPROVED USERS — status + form
    ══════════════════════════════════════════════════════════════ -->
    <div v-else class="max-w-xl mx-auto px-4 py-10">

      <!-- B1: Not logged in -->
      <div v-if="!auth.isLoggedIn" class="bg-card rounded-2xl border border-surface-border px-8 py-10 text-center">
        <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-5">
          <svg class="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h2 class="text-lg font-bold text-text-primary mb-2.5">برای درخواست عمده وارد شوید</h2>
        <p class="text-sm text-text-secondary mb-6 leading-relaxed">
          ابتدا با شماره موبایل وارد شوید، سپس فرم درخواست عمده را تکمیل کنید.
        </p>
        <NuxtLink to="/auth/login?redirect=/wholesale"
                  class="inline-block bg-brand text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
          ورود / ثبت‌نام
        </NuxtLink>
      </div>

      <!-- B2: Pending -->
      <div v-else-if="wholesaleStatus?.status === 'pending'"
           class="bg-card rounded-2xl border border-amber-200 px-8 py-10 text-center">
        <!-- Step tracker -->
        <div class="flex items-center justify-center gap-0 mb-8" aria-label="مراحل درخواست" role="list">
          <div v-for="(step, i) in steps" :key="i" class="flex items-center" role="listitem">
            <div :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
              i <= 1 ? 'bg-amber-400 text-white' : 'bg-surface text-text-secondary border border-surface-border',
            ]">
              <svg v-if="i < 1" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div v-if="i < steps.length - 1"
                 :class="['w-10 h-0.5', i < 1 ? 'bg-amber-400' : 'bg-surface-border']" />
          </div>
        </div>
        <div class="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-lg font-bold text-text-primary mb-2">درخواست شما در حال بررسی است</h2>
        <p class="text-sm text-text-secondary leading-relaxed">
          تیم ما درخواست شما را بررسی می‌کند.<br>
          معمولاً تا <strong class="text-text-primary">۲۴ ساعت کاری</strong> نتیجه از طریق پیامک اطلاع‌رسانی می‌شود.
        </p>
      </div>

      <!-- B3: Rejected -->
      <div v-else-if="wholesaleStatus?.status === 'rejected'">
        <div class="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6" role="alert">
          <p class="text-error font-semibold mb-1">درخواست قبلی رد شد</p>
          <p class="text-red-500 text-sm">{{ wholesaleStatus.rejectedReason || 'اطلاعات کافی ارائه نشده بود.' }}</p>
        </div>
        <h2 class="text-lg font-bold text-center text-text-primary mb-5">ارسال مجدد درخواست</h2>
        <WholesaleRequestForm @submitted="onSubmitted" />
      </div>

      <!-- B4: New request form -->
      <div v-else-if="auth.isLoggedIn">

        <!-- Step tracker -->
        <div class="bg-card border border-surface-border rounded-2xl px-4 pt-5 pb-6 mb-5">
          <p class="text-center text-[11px] font-bold tracking-widest text-text-secondary/60 uppercase mb-5">مراحل عضویت</p>

          <div class="relative flex justify-between items-start max-w-sm mx-auto" aria-label="مراحل ثبت‌نام عمده" role="list">
            <!-- Track line -->
            <div class="absolute top-5 right-[calc(100%/6)] left-[calc(100%/6)] h-0.5 bg-gradient-to-l from-surface-border via-violet-300/30 to-surface-border z-0" aria-hidden="true" />

            <div
              v-for="(step, i) in howItWorks"
              :key="i"
              class="flex-1 flex flex-col items-center gap-2.5 relative z-10 px-1"
              role="listitem"
            >
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-extrabold transition-all',
                i === 0
                  ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/40'
                  : 'bg-bg text-text-secondary border-2 border-surface-border',
              ]">
                <svg v-if="i === 0" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
                <span v-else class="text-sm">{{ i + 1 }}</span>
              </div>
              <p :class="['text-[11px] text-center leading-snug', i === 0 ? 'font-bold text-text-primary' : 'font-medium text-text-secondary']">{{ step }}</p>
              <div v-if="i === 0" class="w-1.5 h-1.5 rounded-full bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.6)] -mt-1" aria-hidden="true" />
            </div>
          </div>
        </div>

        <!-- Form card -->
        <div class="bg-card border border-surface-border rounded-3xl overflow-hidden shadow-modal">
          <!-- Card header -->
          <div class="bg-violet-600/10 border-b border-violet-500/15 px-7 py-6 flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary mb-0.5">درخواست عضویت عمده‌فروشی</h2>
              <p class="text-xs text-text-secondary leading-relaxed">اطلاعات کسب‌وکار خود را وارد کنید</p>
            </div>
          </div>

          <!-- Form body -->
          <div class="px-6 py-7">
            <WholesaleRequestForm @submitted="onSubmitted" />
          </div>
        </div>

        <!-- Trust badges -->
        <div class="flex flex-wrap gap-2.5 justify-center mt-5">
          <span v-for="badge in trustBadges" :key="badge"
                class="text-xs text-text-secondary bg-surface border border-surface-border px-3 py-1 rounded-full">
            {{ badge }}
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import FilterSidebar        from '~/components/products/FilterSidebar.vue'
import FilterMobileDrawer   from '~/components/products/FilterMobileDrawer.vue'
import SortBar              from '~/components/products/SortBar.vue'
import ActiveFilters        from '~/components/products/ActiveFilters.vue'
import WholesaleProductGrid from '~/components/wholesale/WholesaleProductGrid.vue'
import WholesaleRequestForm from '~/components/wholesale/WholesaleRequestForm.vue'
import BasePagination       from '~/components/common/BasePagination.vue'
import { useAuthStore }     from '~/stores/auth.store'
import { useSettingsStore } from '~/stores/settings.store'
import http from '~/services/http.service'

definePageMeta({ layout: 'default' })

const auth          = useAuthStore()
const settingsStore = useSettingsStore()

useSeoMeta({
  title:       () => `فروش عمده | ${settingsStore.siteName}`,
  description: 'خرید عمده عینک طبی، آفتابی و لنز با قیمت ویژه',
  robots:      'index,follow',
})

// ── Static data ──────────────────────────────────────────────
const IconPercent = { template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>` }
const IconTruck   = { template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h3l3 4v3h-3m-3-7v7m0 0H8m0 0a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4z"/></svg>` }
const IconSupport = { template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>` }

const features = [
  { icon: IconPercent, label: 'تا ۳۰٪ تخفیف', sub: 'نسبت به قیمت خرده' },
  { icon: IconTruck,   label: 'ارسال رایگان',  sub: 'برای سفارش‌های عمده' },
  { icon: IconSupport, label: 'پشتیبانی B2B',  sub: 'اختصاصی و سریع' },
]
const steps       = ['ثبت', 'بررسی', 'تأیید']
const howItWorks  = ['فرم را تکمیل کنید', 'منتظر تأیید بمانید', 'با قیمت عمده بخرید']
const trustBadges = ['🔒 اطلاعات محفوظ است', '⚡ بررسی تا ۲۴ ساعت', '✓ بدون تعهد']

// ── Wholesale status ─────────────────────────────────────────
const wholesaleStatus = ref(null)

onMounted(async () => {
  if (!auth.isLoggedIn) return
  try {
    const { data } = await http.get('/users/me/wholesale-status')
    wholesaleStatus.value = data
  } catch {}
})

function onSubmitted() {
  wholesaleStatus.value = { status: 'pending' }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fa-IR')
}

// ── Product filters ──────────────────────────────────────────
const filters = reactive({
  sortBy:         'newest',
  category:       '',
  minPrice:       null,
  maxPrice:       null,
  inStock:        false,
  genders:        [],
  frameShapes:    [],
  frameMaterials: [],
})

const page              = ref(1)
const LIMIT             = 24
const total             = ref(0)
const totalPages        = computed(() => Math.max(1, Math.ceil(total.value / LIMIT)))
const wholesaleProducts = ref([])
const productsLoading   = ref(false)
const mobileFilterOpen  = ref(false)

function buildParams() {
  return {
    status:            'active',
    hasWholesalePrice: true,
    page:              page.value,
    limit:             LIMIT,
    sort:              filters.sortBy,
    ...(filters.category               ? { category:      filters.category                    } : {}),
    ...(filters.minPrice               ? { minPrice:      filters.minPrice                    } : {}),
    ...(filters.maxPrice               ? { maxPrice:      filters.maxPrice                    } : {}),
    ...(filters.inStock                ? { inStock:       true                                } : {}),
    ...(filters.genders?.length        ? { gender:        filters.genders.join(',')           } : {}),
    ...(filters.frameShapes?.length    ? { frameShape:    filters.frameShapes.join(',')       } : {}),
    ...(filters.frameMaterials?.length ? { frameMaterial: filters.frameMaterials.join(',')   } : {}),
  }
}

async function fetchWholesaleProducts() {
  if (!wholesaleStatus.value?.isWholesale) return
  productsLoading.value = true
  try {
    const { data } = await http.get('/products', { params: buildParams() })
    wholesaleProducts.value = data?.items ?? data?.products ?? []
    total.value             = data?.total ?? 0
  } catch (e) {
    wholesaleProducts.value = []
    total.value             = 0
  } finally {
    productsLoading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  fetchWholesaleProducts()
}

function onSortChange() {
  page.value = 1
  fetchWholesaleProducts()
}

function removeFilter(key) {
  if (Array.isArray(filters[key])) filters[key] = []
  else filters[key] = key === 'sortBy' ? 'newest' : null
  page.value = 1
  fetchWholesaleProducts()
}

function clearAllFilters() {
  Object.assign(filters, {
    sortBy: 'newest', category: '', minPrice: null, maxPrice: null,
    inStock: false, genders: [], frameShapes: [], frameMaterials: [],
  })
  page.value = 1
  fetchWholesaleProducts()
}

function onMobileFilterApply(newFilters) {
  Object.assign(filters, newFilters)
  mobileFilterOpen.value = false
  page.value = 1
  fetchWholesaleProducts()
}

async function onPageChange(p) {
  page.value = p
  await fetchWholesaleProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Fetch products once status is confirmed as approved
watch(
  () => wholesaleStatus.value?.isWholesale,
  (approved) => { if (approved) fetchWholesaleProducts() },
  { immediate: true },
)
</script>
