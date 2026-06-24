<template>
  <div class="bg-bg min-h-screen">

    <!-- ══════════════════════════════════════
         APPROVED — status strip
    ══════════════════════════════════════ -->
    <div v-if="wholesaleStatus?.isWholesale"
         class="border-b py-2 px-4 flex items-center justify-center gap-4 flex-wrap text-sm"
         style="background: rgba(5,150,105,0.06); border-color: rgba(5,150,105,0.18);">
      <span class="inline-flex items-center gap-1.5 text-success text-xs font-bold bg-success/10 px-3 py-1 rounded-full">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        حساب عمده فعال
      </span>
      <span v-if="wholesaleStatus.companyName" class="text-text-secondary">
        شرکت: <strong class="text-text-primary">{{ wholesaleStatus.companyName }}</strong>
      </span>
      <span v-if="wholesaleStatus.approvedAt" class="text-text-secondary/60 text-xs">
        تأیید: {{ formatDate(wholesaleStatus.approvedAt) }}
      </span>
    </div>

    <!-- ══════════════════════════════════════
         APPROVED — sticky search + categories
    ══════════════════════════════════════ -->
    <div v-if="wholesaleStatus?.isWholesale"
         class="sticky top-0 z-30 border-b"
         style="background: var(--color-card); border-color: var(--color-border); box-shadow: 0 2px 12px rgba(0,0,0,0.06);">

      <!-- Search row -->
      <div class="container-main pt-3 pb-2">
        <div class="relative">
          <svg class="absolute top-1/2 -translate-y-1/2 end-3.5 w-4.5 h-4.5 pointer-events-none"
               style="color: var(--color-text-secondary);"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
          </svg>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="جستجو بر اساس نام محصول، مدل یا برند..."
            class="w-full pe-11 ps-4 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            style="border-color: var(--color-border); background: var(--color-surface);"
            @input="onSearchInput"
          />
        </div>
      </div>

      <!-- Category chips -->
      <div class="container-main overflow-x-auto scrollbar-none pb-3 flex items-center gap-2">
        <button
          class="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
          :class="!filters.category
            ? 'text-white shadow-sm'
            : 'text-text-secondary hover:text-brand border border-surface-border bg-surface'"
          :style="!filters.category ? 'background: var(--color-brand)' : ''"
          @click="setCategory('')"
        >همه محصولات</button>

        <button
          v-for="cat in categories"
          :key="cat._id"
          class="shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
          :class="filters.category === cat._id
            ? 'text-white shadow-sm'
            : 'text-text-secondary hover:text-brand border border-surface-border bg-surface'"
          :style="filters.category === cat._id ? 'background: var(--color-brand)' : ''"
          @click="setCategory(cat._id)"
        >
          <img v-if="cat.image" :src="cat.image" class="w-3.5 h-3.5 object-contain rounded-sm shrink-0" :alt="cat.name" />
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         APPROVED — catalog
    ══════════════════════════════════════ -->
    <div v-if="wholesaleStatus?.isWholesale" class="container-main py-5">

      <ActiveFilters :filters="filters" @remove="removeFilter" @clear-all="clearAllFilters" />

      <div class="flex gap-5 items-start">

        <!-- Desktop filter sidebar -->
        <div class="hidden lg:block sticky top-[130px] self-start shrink-0">
          <FilterSidebar :filters="filters" @change="onFilterChange" />
        </div>

        <!-- Main content -->
        <div class="flex-1 min-w-0">

          <SortBar
            v-model="filters.sortBy"
            :total="total"
            :loading="productsLoading"
            @update:modelValue="onSortChange"
            @open-filter="mobileFilterOpen = true"
          />

          <!-- Empty state -->
          <div v-if="!productsLoading && wholesaleProducts.length === 0"
               class="bg-card border border-surface-border rounded-2xl flex flex-col items-center py-20 text-center mt-4">
            <div class="w-20 h-20 rounded-full bg-surface flex items-center justify-center text-4xl mb-5">🔍</div>
            <p class="font-bold text-text-primary mb-1.5">محصولی یافت نشد</p>
            <p class="text-sm text-text-secondary mb-6 max-w-xs">فیلترها را تغییر دهید یا عبارت جستجوی دیگری امتحان کنید</p>
            <button
              class="text-sm font-bold text-brand hover:underline border border-brand/30 px-5 py-2 rounded-xl hover:bg-brand/5 transition-colors"
              @click="clearAllFilters">
              پاک کردن فیلترها
            </button>
          </div>

          <WholesaleProductGrid v-else :products="wholesaleProducts" :loading="productsLoading" />

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

    <!-- ══════════════════════════════════════
         NON-APPROVED — benefits + form
    ══════════════════════════════════════ -->
    <div v-else>

      <!-- Benefits strip -->
      <section class="py-12 px-4" style="background: var(--color-bg);">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-8">
            <h2 class="text-xl font-black text-text-primary mb-2">چرا عمده‌فروش استورین شوید؟</h2>
            <p class="text-sm text-text-secondary">امکانات ویژه‌ای که برای کسب‌وکار شما فراهم کرده‌ایم</p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="b in benefits" :key="b.label"
                 class="bg-card border border-surface-border rounded-2xl p-5 text-center shadow-card hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default">
              <div class="text-4xl mb-3 leading-none" aria-hidden="true">{{ b.emoji }}</div>
              <div class="text-sm font-bold text-text-primary mb-2 leading-snug">{{ b.label }}</div>
              <div class="text-xs text-text-secondary leading-relaxed">{{ b.desc }}</div>
            </div>
          </div>
        </div>
      </section>

      <div class="max-w-xl mx-auto px-4 pb-16">

        <!-- NOT LOGGED IN -->
        <div v-if="!auth.isLoggedIn"
             class="relative overflow-hidden bg-card rounded-3xl border border-surface-border text-center shadow-modal">
          <div class="absolute inset-0 pointer-events-none"
               style="background: radial-gradient(ellipse at 50% -20%, rgba(124,58,237,0.06) 0%, transparent 65%);" aria-hidden="true"/>
          <div class="relative px-8 py-14">
            <div class="w-20 h-20 rounded-2xl mx-auto mb-7 flex items-center justify-center text-4xl shadow-xl"
                 style="background: linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%); box-shadow: 0 12px 30px rgba(124,58,237,0.2);">
              🔑
            </div>
            <h2 class="text-xl font-black text-text-primary mb-3">برای درخواست عمده وارد شوید</h2>
            <p class="text-sm text-text-secondary mb-9 leading-relaxed max-w-xs mx-auto">
              ابتدا با شماره موبایل وارد شوید، سپس فرم درخواست عمده را تکمیل کنید.
            </p>
            <NuxtLink
              to="/auth/login?redirect=/wholesale"
              class="inline-flex items-center gap-2 text-white font-bold px-9 py-3.5 rounded-2xl hover:opacity-90 transition-all duration-200 active:scale-95"
              style="background: linear-gradient(135deg, #7c3aed, #6d28d9); box-shadow: 0 8px 28px rgba(124,58,237,0.38);">
              ورود / ثبت‌نام
              <svg class="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </NuxtLink>
          </div>
        </div>

        <!-- PENDING -->
        <div v-else-if="wholesaleStatus?.status === 'pending'"
             class="bg-card rounded-3xl border border-surface-border px-8 py-12 text-center shadow-modal">

          <!-- Steps -->
          <div class="flex items-center justify-center gap-0 mb-10" aria-label="مراحل درخواست" role="list">
            <div v-for="(step, i) in steps" :key="i" class="flex items-center" role="listitem">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                   :style="i <= 1
                     ? 'background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; box-shadow: 0 4px 14px rgba(245,158,11,0.42)'
                     : 'background: var(--color-surface); color: var(--color-text-secondary); border: 2px solid var(--color-border)'">
                <svg v-if="i < 1" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <div v-if="i < steps.length - 1" class="w-12 sm:w-16 h-0.5 transition-colors"
                   :style="i < 1 ? 'background: #f59e0b' : 'background: var(--color-border)'"/>
            </div>
          </div>

          <div class="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-5 text-4xl">⏳</div>
          <h2 class="text-xl font-black text-text-primary mb-3">درخواست در حال بررسی</h2>
          <p class="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
            تیم ما درخواست شما را بررسی می‌کند.<br>
            معمولاً تا <strong class="text-amber-600 font-bold">۲۴ ساعت کاری</strong> نتیجه از طریق پیامک اعلام می‌شود.
          </p>
        </div>

        <!-- REJECTED -->
        <div v-else-if="wholesaleStatus?.status === 'rejected'">
          <div class="flex items-start gap-3 border border-red-200 rounded-2xl p-4 mb-7"
               style="background: rgba(220,38,38,0.04);" role="alert">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                 style="background: rgba(220,38,38,0.1); color: #dc2626;">✗</div>
            <div>
              <p class="text-error font-bold text-sm mb-0.5">درخواست قبلی رد شد</p>
              <p class="text-red-500/80 text-xs leading-relaxed">
                {{ wholesaleStatus.rejectedReason || 'اطلاعات کافی ارائه نشده بود.' }}
              </p>
            </div>
          </div>
          <h2 class="text-lg font-bold text-center text-text-primary mb-6">ارسال مجدد درخواست</h2>
          <WholesaleRequestForm @submitted="onSubmitted" />
        </div>

        <!-- NEW APPLICATION FORM -->
        <div v-else-if="auth.isLoggedIn">

          <!-- How it works -->
          <div class="bg-card border border-surface-border rounded-2xl p-5 mb-6 shadow-card">
            <p class="text-center text-[11px] font-bold tracking-widest text-text-secondary/50 uppercase mb-5">
              مراحل عضویت
            </p>
            <div class="relative flex justify-between items-start max-w-xs mx-auto">
              <div class="absolute top-[18px] right-[calc(100%/6)] left-[calc(100%/6)] h-px z-0"
                   style="background: linear-gradient(90deg, rgba(124,58,237,0.5), rgba(109,40,217,0.12));" aria-hidden="true"/>
              <div v-for="(step, i) in howItWorks" :key="i"
                   class="flex-1 flex flex-col items-center gap-2 relative z-10 px-1">
                <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                     :style="i === 0
                       ? 'background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; box-shadow: 0 4px 16px rgba(124,58,237,0.42)'
                       : 'background: var(--color-bg); color: var(--color-text-secondary); border: 2px solid var(--color-border)'">
                  <svg v-if="i === 0" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                  </svg>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <p class="text-[11px] text-center leading-snug"
                   :class="i === 0 ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'">
                  {{ step }}
                </p>
              </div>
            </div>
          </div>

          <!-- Form card -->
          <div class="bg-card border border-surface-border rounded-3xl overflow-hidden shadow-modal">
            <div class="flex items-center gap-4 px-7 py-6"
                 style="background: linear-gradient(135deg, rgba(124,58,237,0.07), rgba(109,40,217,0.02)); border-bottom: 1px solid rgba(124,58,237,0.1);">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                   style="background: linear-gradient(135deg, #7c3aed, #6d28d9); box-shadow: 0 6px 20px rgba(124,58,237,0.38);">
                🏢
              </div>
              <div>
                <h2 class="text-lg font-extrabold text-text-primary mb-0.5">درخواست عضویت عمده‌فروشی</h2>
                <p class="text-xs text-text-secondary">اطلاعات کسب‌وکار خود را وارد کنید</p>
              </div>
            </div>
            <div class="px-6 py-7">
              <WholesaleRequestForm @submitted="onSubmitted" />
            </div>
          </div>

          <!-- Trust badges -->
          <div class="flex flex-wrap gap-2 justify-center mt-5">
            <span v-for="badge in trustBadges" :key="badge"
                  class="text-xs text-text-secondary bg-surface border border-surface-border px-3 py-1.5 rounded-full hover:border-brand/30 transition-colors cursor-default">
              {{ badge }}
            </span>
          </div>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════
         HERO (bottom)
    ══════════════════════════════════════ -->
    <section class="relative overflow-hidden"
             style="background: linear-gradient(145deg, #06101f 0%, #0f2040 45%, #071628 100%);">

      <!-- Ambient glow -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[100px] opacity-20"
             style="background: radial-gradient(ellipse, #f59e0b 0%, #d97706 40%, transparent 75%);"/>
        <div class="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full blur-3xl opacity-10"
             style="background: radial-gradient(ellipse, #3b82f6 0%, transparent 70%);"/>
        <div class="absolute inset-0 opacity-[0.03]"
             style="background-image:linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px);background-size:48px 48px;"/>
      </div>

      <div class="relative px-4 pt-16 pb-14 max-w-5xl mx-auto">
        <div class="text-center max-w-3xl mx-auto">

          <!-- B2B badge -->
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-xs font-bold tracking-widest uppercase"
               style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.28); color: #fbbf24;">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true"/>
            B2B · فروش عمده تخصصی
          </div>

          <h1 class="font-black text-white leading-tight mb-5"
              style="font-size: clamp(2rem, 5.5vw, 3.2rem); letter-spacing: -0.01em;">
            فروش عمده
            <span class="relative inline-block ms-2">
              <span style="background: linear-gradient(90deg, #f59e0b, #fde68a, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                {{ settingsStore.siteName }}
              </span>
              <span class="absolute -bottom-1 start-0 end-0 h-0.5 rounded-full opacity-60"
                    style="background: linear-gradient(90deg, #f59e0b, #fde68a);" aria-hidden="true"/>
            </span>
          </h1>

          <p class="text-white/55 leading-relaxed mb-12 text-base">
            قیمت‌های ویژه عمده · حداقل سفارش مشخص · پشتیبانی اختصاصی B2B
          </p>

          <!-- Feature cards -->
          <div class="grid grid-cols-3 gap-3 max-w-xl mx-auto">
            <div v-for="f in features" :key="f.label"
                 class="rounded-2xl px-3 py-4 text-center group cursor-default transition-transform hover:-translate-y-0.5"
                 style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(4px);">
              <div class="text-3xl mb-2.5 leading-none" aria-hidden="true">{{ f.emoji }}</div>
              <div class="text-white text-xs font-bold leading-snug">{{ f.label }}</div>
              <div class="text-white/35 text-[10px] mt-1 leading-relaxed">{{ f.sub }}</div>
            </div>
          </div>
        </div>

        <!-- Stats strip -->
        <div class="mt-12 grid grid-cols-3 max-w-lg mx-auto gap-px overflow-hidden rounded-2xl"
             style="background: rgba(255,255,255,0.08);">
          <div v-for="(s, i) in stats" :key="s.label"
               class="flex flex-col items-center py-4 px-2"
               :style="`background: rgba(255,255,255,0.03);`">
            <div class="font-black text-xl font-fanum" style="color: #fbbf24;">{{ s.value }}</div>
            <div class="text-white/40 text-[11px] mt-0.5 text-center leading-snug">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

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

// ── Static content ────────────────────────────────────────────
const features = [
  { emoji: '🏷️', label: 'تا ۳۵٪ تخفیف',   sub: 'نسبت به قیمت خرده' },
  { emoji: '🚚', label: 'ارسال رایگان',   sub: 'برای سفارش‌های عمده' },
  { emoji: '🤝', label: 'پشتیبانی B2B',   sub: 'اختصاصی و سریع' },
]
const stats = [
  { value: '+۱۲۰۰', label: 'محصول عمده' },
  { value: '+۱۵۰',  label: 'برند فعال'   },
  { value: '۲۴ ساعت', label: 'تحویل سریع' },
]
const benefits = [
  { emoji: '💰', label: 'قیمت ویژه عمده',    desc: 'تا ۳۵٪ ارزان‌تر از قیمت خرده‌فروشی' },
  { emoji: '📦', label: 'حداقل سفارش شفاف', desc: 'بدون ابهام در تعداد سفارش' },
  { emoji: '🚚', label: 'ارسال رایگان',      desc: 'از آستانه سفارش مشخص' },
  { emoji: '📞', label: 'مشاور اختصاصی',    desc: 'پشتیبانی B2B مستقیم' },
]
const steps      = ['ثبت', 'بررسی', 'تأیید']
const howItWorks = ['فرم را تکمیل کنید', 'منتظر تأیید بمانید', 'با قیمت عمده بخرید']
const trustBadges = ['🔒 اطلاعات محفوظ', '⚡ بررسی تا ۲۴ ساعت', '✓ بدون تعهد اولیه']

// ── Wholesale status ──────────────────────────────────────────
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
  return d ? new Date(d).toLocaleDateString('fa-IR') : ''
}

// ── Categories ────────────────────────────────────────────────
const categories = ref([])

onMounted(async () => {
  try {
    const { data } = await http.get('/categories', { params: { level: 1, limit: 20 } })
    categories.value = data?.items ?? data?.categories ?? data ?? []
  } catch {}
})

// ── Search ────────────────────────────────────────────────────
const searchQuery = ref('')
let   searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchWholesaleProducts()
  }, 420)
}

// ── Category quick-filter ─────────────────────────────────────
function setCategory(id) {
  filters.category = id
  page.value = 1
  fetchWholesaleProducts()
}

// ── Product filters ───────────────────────────────────────────
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
    ...(searchQuery.value                  ? { search:       searchQuery.value                  } : {}),
    ...(filters.category                   ? { category:     filters.category                   } : {}),
    ...(filters.minPrice                   ? { minPrice:     filters.minPrice                   } : {}),
    ...(filters.maxPrice                   ? { maxPrice:     filters.maxPrice                   } : {}),
    ...(filters.inStock                    ? { inStock:      true                               } : {}),
    ...(filters.genders?.length            ? { gender:       filters.genders.join(',')          } : {}),
    ...(filters.frameShapes?.length        ? { frameShape:   filters.frameShapes.join(',')      } : {}),
    ...(filters.frameMaterials?.length     ? { frameMaterial: filters.frameMaterials.join(',')  } : {}),
  }
}

async function fetchWholesaleProducts() {
  if (!wholesaleStatus.value?.isWholesale) return
  productsLoading.value = true
  try {
    const { data } = await http.get('/products', { params: buildParams() })
    wholesaleProducts.value = data?.items ?? data?.products ?? []
    total.value             = data?.total ?? 0
  } catch {
    wholesaleProducts.value = []
    total.value             = 0
  } finally {
    productsLoading.value = false
  }
}

function onFilterChange() { page.value = 1; fetchWholesaleProducts() }
function onSortChange()   { page.value = 1; fetchWholesaleProducts() }

function removeFilter(key) {
  if (Array.isArray(filters[key])) filters[key] = []
  else filters[key] = key === 'sortBy' ? 'newest' : null
  page.value = 1
  fetchWholesaleProducts()
}

function clearAllFilters() {
  searchQuery.value = ''
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

watch(
  () => wholesaleStatus.value?.isWholesale,
  (approved) => { if (approved) fetchWholesaleProducts() },
  { immediate: true },
)
</script>

<style scoped>
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
