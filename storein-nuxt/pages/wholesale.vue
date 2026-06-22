<template>
  <div style="background: var(--color-bg); min-height: 100vh;">

    <!-- ═══════════════════════════════════════════════════════════
         HERO SECTION — shown to all users
    ══════════════════════════════════════════════════════════════ -->
    <section style="background: linear-gradient(135deg, #1e3a5f 0%, #0f1f35 100%);
                    padding: 60px 16px 48px; text-align: center; position: relative; overflow: hidden;">

      <!-- Subtle grid pattern overlay -->
      <div style="position:absolute;inset:0;opacity:0.04;
                  background-image:linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),
                                   linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px);
                  background-size:40px 40px; pointer-events:none;" />

      <div style="max-width:800px; margin:0 auto; position:relative;">

        <!-- Badge -->
        <div style="display:inline-flex; align-items:center; gap:6px;
                    background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3);
                    color:#fbbf24; font-size:12px; font-weight:700;
                    padding:4px 14px; border-radius:20px; margin-bottom:20px;">
          <span>B2B</span>
          <span style="opacity:0.5">|</span>
          <span>فروش عمده</span>
        </div>

        <h1 style="font-size:clamp(1.8rem,5vw,2.8rem); font-weight:900; color:#fff;
                   margin-bottom:12px; line-height:1.2;">
          فروش عمده {{ settingsStore.siteName }}
        </h1>
        <p style="color:rgba(255,255,255,0.7); font-size:1rem; margin-bottom:40px;">
          قیمت‌های ویژه · حداقل سفارش مشخص · پشتیبانی اختصاصی B2B
        </p>

        <!-- 3 feature cards -->
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; max-width:600px; margin:0 auto;">
          <div v-for="f in features" :key="f.label"
               style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
                      border-radius:12px; padding:16px 12px; text-align:center;">
            <div style="font-size:1.6rem; margin-bottom:8px;">{{ f.icon }}</div>
            <div style="color:#fff; font-size:13px; font-weight:600; line-height:1.4;">{{ f.label }}</div>
            <div style="color:rgba(255,255,255,0.5); font-size:11px; margin-top:4px;">{{ f.sub }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         STATUS BAR — only for approved users (compact)
    ══════════════════════════════════════════════════════════════ -->
    <div v-if="wholesaleStatus?.isWholesale"
         style="background:rgba(34,197,94,0.08); border-bottom:1px solid rgba(34,197,94,0.2);
                padding:10px 20px; display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap;">
      <span style="display:inline-flex; align-items:center; gap:5px; background:rgba(34,197,94,0.15);
                   color:#16a34a; font-size:12px; font-weight:700; padding:3px 10px; border-radius:20px;">
        ✓ حساب عمده فعال
      </span>
      <span v-if="wholesaleStatus.companyName"
            style="font-size:13px; color:var(--color-text-secondary);">
        شرکت: <strong style="color:var(--color-text-primary);">{{ wholesaleStatus.companyName }}</strong>
      </span>
      <span v-if="wholesaleStatus.approvedAt"
            style="font-size:12px; color:var(--color-text-secondary);">
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
    <div v-else style="max-width:600px; margin:0 auto; padding:40px 16px;">

      <!-- B1: Not logged in -->
      <div v-if="!auth.isLoggedIn"
           style="background:var(--color-card); border-radius:20px;
                  border:1px solid var(--color-border); padding:40px 32px; text-align:center;">
        <div style="width:64px; height:64px; border-radius:50%;
                    background:rgba(99,102,241,0.1);
                    display:flex; align-items:center; justify-content:center;
                    margin:0 auto 20px; font-size:28px;">🔐</div>
        <h2 style="font-size:1.2rem; font-weight:700; color:var(--color-text-primary); margin-bottom:10px;">
          برای درخواست عمده وارد شوید
        </h2>
        <p style="font-size:14px; color:var(--color-text-secondary); margin-bottom:24px; line-height:1.7;">
          ابتدا با شماره موبایل وارد شوید، سپس فرم درخواست عمده را تکمیل کنید.
        </p>
        <NuxtLink to="/auth/login?redirect=/wholesale"
                  class="inline-block bg-brand text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
          ورود / ثبت‌نام
        </NuxtLink>
      </div>

      <!-- B2: Pending -->
      <div v-else-if="wholesaleStatus?.status === 'pending'"
           style="background:var(--color-card); border-radius:20px;
                  border:1px solid rgba(245,158,11,0.3); padding:40px 32px; text-align:center;">
        <!-- Step tracker -->
        <div style="display:flex; align-items:center; justify-content:center; gap:0; margin-bottom:32px;">
          <div v-for="(step, i) in steps" :key="i" style="display:flex; align-items:center;">
            <div :style="`width:32px; height:32px; border-radius:50%; display:flex;
                          align-items:center; justify-content:center; font-size:13px; font-weight:700;
                          background:${i <= 1 ? '#f59e0b' : 'var(--color-surface)'};
                          color:${i <= 1 ? '#fff' : 'var(--color-text-secondary)'};`">
              {{ i < 1 ? '✓' : i + 1 }}
            </div>
            <div v-if="i < steps.length - 1"
                 :style="`width:40px; height:2px; background:${i < 1 ? '#f59e0b' : 'var(--color-border)'};`" />
          </div>
        </div>
        <div style="font-size:2.5rem; margin-bottom:16px;">⏳</div>
        <h2 style="font-size:1.2rem; font-weight:700; color:var(--color-text-primary); margin-bottom:8px;">
          درخواست شما در حال بررسی است
        </h2>
        <p style="font-size:14px; color:var(--color-text-secondary); line-height:1.7;">
          تیم ما درخواست شما را بررسی می‌کند.<br>
          معمولاً تا <strong>۲۴ ساعت کاری</strong> نتیجه از طریق پیامک اطلاع‌رسانی می‌شود.
        </p>
      </div>

      <!-- B3: Rejected -->
      <div v-else-if="wholesaleStatus?.status === 'rejected'">
        <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
                    border-radius:14px; padding:16px 20px; margin-bottom:24px;">
          <p style="color:#dc2626; font-weight:600; margin-bottom:4px;">درخواست قبلی رد شد</p>
          <p style="color:#ef4444; font-size:13px;">{{ wholesaleStatus.rejectedReason || 'اطلاعات کافی ارائه نشده بود.' }}</p>
        </div>
        <h2 style="font-size:1.1rem; font-weight:700; text-align:center;
                   color:var(--color-text-primary); margin-bottom:20px;">ارسال مجدد درخواست</h2>
        <WholesaleRequestForm @submitted="onSubmitted" />
      </div>

      <!-- B4: New request form -->
      <div v-else-if="auth.isLoggedIn">

        <!-- Step tracker -->
        <div style="margin-bottom: 36px;">
          <div style="display:flex; align-items:flex-start; justify-content:center; gap:0; position:relative;">
            <div v-for="(step, i) in howItWorks" :key="i"
                 style="display:flex; flex-direction:column; align-items:center; flex:1; max-width:160px; position:relative;">

              <!-- Connector line (before this step, except first) -->
              <div v-if="i > 0"
                   style="position:absolute; top:20px; right:50%; left:0; height:2px;
                          background: linear-gradient(to left, rgba(99,102,241,0.35), rgba(99,102,241,0.12));
                          transform: translateY(-50%); z-index:0;" />

              <!-- Circle -->
              <div :style="`
                position:relative; z-index:1;
                width:40px; height:40px; border-radius:50%;
                display:flex; align-items:center; justify-content:center;
                font-size:15px; font-weight:800;
                background: ${i === 0
                  ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                  : 'var(--color-surface)'};
                color: ${i === 0 ? '#fff' : 'var(--color-text-secondary)'};
                border: 2px solid ${i === 0 ? 'transparent' : 'var(--color-border)'};
                box-shadow: ${i === 0 ? '0 4px 14px rgba(109,40,217,0.35)' : 'none'};
                margin-bottom:10px;
              `">
                <span v-if="i === 0" style="font-size:17px;">✦</span>
                <span v-else>{{ i + 1 }}</span>
              </div>

              <!-- Label -->
              <p :style="`
                font-size:clamp(11px,2.8vw,13px); font-weight:600; text-align:center;
                line-height:1.4; padding:0 4px;
                color: ${i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'};
              `">{{ step }}</p>
            </div>
          </div>
        </div>

        <!-- Form card -->
        <div style="
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
        ">
          <!-- Card header -->
          <div style="
            background: linear-gradient(135deg, rgba(109,40,217,0.12) 0%, rgba(109,40,217,0.04) 100%);
            border-bottom: 1px solid rgba(109,40,217,0.15);
            padding: 24px 28px 20px;
            display: flex; align-items: center; gap: 14px;
          ">
            <div style="
              width:48px; height:48px; border-radius:14px; flex-shrink:0;
              background:linear-gradient(135deg,#7c3aed,#6d28d9);
              display:flex; align-items:center; justify-content:center;
              font-size:22px;
              box-shadow: 0 4px 14px rgba(109,40,217,0.35);
            ">🏪</div>
            <div>
              <h2 style="font-size:1.1rem; font-weight:800; color:var(--color-text-primary); margin-bottom:2px;">
                درخواست عضویت عمده‌فروشی
              </h2>
              <p style="font-size:12px; color:var(--color-text-secondary); line-height:1.5;">
                اطلاعات کسب‌وکار خود را وارد کنید
              </p>
            </div>
          </div>

          <!-- Form body -->
          <div style="padding: 24px 24px 28px;">
            <WholesaleRequestForm @submitted="onSubmitted" />
          </div>
        </div>

        <!-- Trust badges -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-top:20px;">
          <span v-for="badge in trustBadges" :key="badge"
                style="font-size:11px; color:var(--color-text-secondary);
                       background:var(--color-surface); border:1px solid var(--color-border);
                       padding:4px 12px; border-radius:20px;">
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
const features = [
  { icon: '💰', label: 'تا ۳۰٪ تخفیف',  sub: 'نسبت به قیمت خرده' },
  { icon: '🚚', label: 'ارسال رایگان',   sub: 'برای سفارش‌های عمده' },
  { icon: '🤝', label: 'پشتیبانی B2B',   sub: 'اختصاصی و سریع' },
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
