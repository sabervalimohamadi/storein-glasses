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
         APPROVED — browse (category + brands)
    ══════════════════════════════════════ -->
    <div v-if="wholesaleStatus?.isWholesale && view === 'browse'">

      <!-- ── Hero header ── -->
      <div class="relative overflow-hidden border-b" style="border-color:var(--color-border);">
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
             style="background:radial-gradient(ellipse 80% 120% at 80% -20%,rgba(124,58,237,0.10) 0%,transparent 60%);"/>
        <div class="absolute inset-0 pointer-events-none opacity-[0.025]" aria-hidden="true"
             style="background-image:linear-gradient(var(--color-border) 1px,transparent 1px),linear-gradient(90deg,var(--color-border) 1px,transparent 1px);background-size:32px 32px;"/>
        <div class="relative container-main py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-text-primary leading-tight">کاتالوگ عمده</h1>
            <p class="text-sm text-text-secondary mt-1">دسته‌بندی و برند مورد نظر را انتخاب کنید</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <div v-for="s in stats" :key="s.label"
                 class="flex items-center gap-2 px-3.5 py-2 rounded-xl border"
                 style="background:var(--color-card); border-color:var(--color-border);">
              <span class="font-black text-brand text-sm font-fanum">{{ s.value }}</span>
              <span class="text-text-secondary text-[11px]">{{ s.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Categories ── -->
      <div class="border-b" style="border-color:var(--color-border); background:var(--color-card);">
        <div class="container-main py-5">
          <p class="text-[10px] font-black text-text-secondary/50 tracking-widest uppercase mb-3">دسته‌بندی</p>

          <div class="relative">
            <!-- Fade: end -->
            <div class="pointer-events-none absolute top-0 bottom-0 end-8 w-12 z-10"
                 style="background:linear-gradient(to left,var(--color-card) 0%,transparent 100%);" aria-hidden="true"/>
            <!-- Fade: start -->
            <div class="pointer-events-none absolute top-0 bottom-0 start-8 w-12 z-10"
                 style="background:linear-gradient(to right,var(--color-card) 0%,transparent 100%);" aria-hidden="true"/>

            <!-- Arrow end -->
            <button v-show="canScrollRight"
              class="absolute end-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
              style="background:var(--color-bg); border:1.5px solid var(--color-border);"
              @click="scrollCats('right')" aria-label="بعدی">
              <svg class="w-3 h-3 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <!-- Arrow start -->
            <button v-show="canScrollLeft"
              class="absolute start-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
              style="background:var(--color-bg); border:1.5px solid var(--color-border);"
              @click="scrollCats('left')" aria-label="قبلی">
              <svg class="w-3 h-3 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <!-- Strip -->
            <div ref="catStripRef"
                 class="overflow-x-auto scrollbar-none flex gap-2 px-9"
                 @scroll="onCatScroll">

              <!-- All -->
              <button class="shrink-0 group" @click="selectCategory(null)">
                <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 group-active:scale-95"
                     :style="!selectedCategory
                       ? 'background:linear-gradient(135deg,#7c3aed,#6d28d9); box-shadow:0 4px 14px rgba(124,58,237,0.4);'
                       : 'background:var(--color-surface); border:1.5px solid var(--color-border);'">
                  <span class="text-lg leading-none">🏪</span>
                  <span class="text-xs font-bold whitespace-nowrap"
                        :class="!selectedCategory ? 'text-white' : 'text-text-primary'">همه</span>
                </div>
              </button>

              <!-- Category pills -->
              <button v-for="cat in categories" :key="cat._id"
                      class="shrink-0 group" @click="selectCategory(cat)">
                <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 group-active:scale-95"
                     :style="selectedCategory?._id === cat._id
                       ? 'background:linear-gradient(135deg,#7c3aed,#6d28d9); box-shadow:0 4px 14px rgba(124,58,237,0.4);'
                       : 'background:var(--color-surface); border:1.5px solid var(--color-border);'">
                  <div class="w-6 h-6 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                       :style="selectedCategory?._id === cat._id ? '' : 'background:var(--color-border);'">
                    <img v-if="cat.icon || cat.image" :src="cat.icon || cat.image" :alt="cat.name"
                         class="w-full h-full object-cover"/>
                    <span v-else class="text-sm">📦</span>
                  </div>
                  <span class="text-xs font-bold whitespace-nowrap"
                        :class="selectedCategory?._id === cat._id ? 'text-white' : 'text-text-primary'">{{ cat.name }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Brands ── -->
      <div class="container-main py-8">

        <!-- Header row -->
        <div class="flex items-center justify-between gap-3 mb-6">
          <div>
            <h2 class="text-lg font-black text-text-primary">
              {{ selectedCategory ? `برندهای ${selectedCategory.name}` : 'همه برندها' }}
            </h2>
            <p class="text-xs text-text-secondary mt-0.5">{{ displayedBrands.length }} برند موجود</p>
          </div>
          <div class="relative shrink-0">
            <svg class="absolute top-1/2 -translate-y-1/2 end-3 w-3.5 h-3.5 pointer-events-none text-text-secondary/50"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
            </svg>
            <input v-model="brandSearch" type="search" placeholder="جستجوی برند..."
                   class="w-40 sm:w-52 pe-9 ps-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                   style="border-color:var(--color-border); background:var(--color-surface);"/>
          </div>
        </div>

        <!-- Skeleton -->
        <div v-if="brandsLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div v-for="n in 10" :key="n" class="rounded-2xl animate-pulse"
               style="aspect-ratio:4/3; background:var(--color-surface);"/>
        </div>

        <!-- Empty -->
        <div v-else-if="displayedBrands.length === 0"
             class="flex flex-col items-center py-24 text-center">
          <div class="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5"
               style="background:var(--color-surface);">🏷️</div>
          <p class="font-black text-text-primary mb-1.5">برندی یافت نشد</p>
          <p class="text-sm text-text-secondary">در این دسته‌بندی برندی موجود نیست</p>
        </div>

        <!-- Brand grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <button v-for="brand in displayedBrands" :key="brand._id ?? brand.slug"
                  class="group relative rounded-2xl overflow-hidden transition-all duration-250 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95"
                  style="aspect-ratio:4/3; background:var(--color-card); border:1.5px solid var(--color-border);"
                  @click="selectBrand(brand)">

            <!-- Hover glow border -->
            <div class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                 style="box-shadow:inset 0 0 0 1.5px var(--color-brand), 0 0 32px rgba(124,58,237,0.15);" aria-hidden="true"/>

            <!-- Subtle bg pattern -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                 aria-hidden="true"
                 style="background:radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.06) 0%,transparent 70%);"/>

            <!-- Logo / name -->
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
              <img v-if="brand.logo" :src="brand.logo" :alt="brand.name"
                   class="max-h-14 max-w-[75%] object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"/>
              <span v-else class="font-black text-center text-text-primary leading-tight transition-colors group-hover:text-brand"
                    style="font-size:clamp(13px,2.5vw,19px);">{{ brand.name }}</span>
              <p v-if="brand.logo"
                 class="text-[10px] font-semibold text-text-secondary group-hover:text-brand/80 transition-colors text-center w-full truncate leading-none">
                {{ brand.name }}
              </p>
            </div>

            <!-- Arrow chip -->
            <div class="absolute top-2.5 end-2.5 z-20 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 -translate-y-1 group-hover:translate-y-0">
              <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-lg" style="background:var(--color-brand);">
                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         APPROVED — products view
    ══════════════════════════════════════ -->
    <div v-else-if="wholesaleStatus?.isWholesale && view === 'products'">

      <div class="sticky top-0 z-30 border-b shadow-sm"
           style="background: var(--color-card); border-color: var(--color-border);">
        <div class="container-main py-2.5 flex items-center gap-3">
          <button
            class="shrink-0 flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
            @click="backToBrowse"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
            بازگشت
          </button>

          <div class="w-px h-4 bg-surface-border shrink-0"/>

          <div class="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
            <span v-if="selectedCategory" class="text-xs text-text-secondary shrink-0 truncate">{{ selectedCategory.name }}</span>
            <svg v-if="selectedCategory && selectedBrand" class="w-3 h-3 text-text-secondary/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            <div v-if="selectedBrand" class="flex items-center gap-1.5 shrink-0 min-w-0">
              <img v-if="selectedBrand.logo" :src="selectedBrand.logo" class="h-4 object-contain shrink-0" :alt="selectedBrand.name" />
              <span class="text-xs font-bold text-text-primary truncate">{{ selectedBrand.name }}</span>
            </div>
          </div>

          <div class="relative w-48 hidden sm:block shrink-0">
            <svg class="absolute top-1/2 -translate-y-1/2 end-3 w-3.5 h-3.5 pointer-events-none text-text-secondary"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="جستجوی محصول..."
              class="w-full pe-9 ps-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              style="border-color: var(--color-border); background: var(--color-surface);"
              @input="onSearchInput"
            />
          </div>
        </div>
      </div>

      <div class="container-main py-5">
        <ActiveFilters :filters="filters" @remove="removeFilter" @clear-all="clearAllFilters" />

        <div class="flex gap-5 items-start">
          <div class="hidden lg:block sticky top-[60px] self-start shrink-0">
            <FilterSidebar :filters="filters" @change="onFilterChange" />
          </div>

          <div class="flex-1 min-w-0">
            <SortBar
              v-model="filters.sortBy"
              :total="total"
              :loading="productsLoading"
              @update:modelValue="onSortChange"
              @open-filter="mobileFilterOpen = true"
            />

            <div v-if="!productsLoading && wholesaleProducts.length === 0"
                 class="bg-card border border-surface-border rounded-2xl flex flex-col items-center py-20 text-center mt-4">
              <div class="w-20 h-20 rounded-full bg-surface flex items-center justify-center text-4xl mb-5">🔍</div>
              <p class="font-bold text-text-primary mb-1.5">محصولی یافت نشد</p>
              <p class="text-sm text-text-secondary mb-6 max-w-xs">فیلترها را تغییر دهید یا برند دیگری انتخاب کنید</p>
              <button class="text-sm font-bold text-brand border border-brand/30 px-5 py-2 rounded-xl hover:bg-brand/5 transition-colors"
                      @click="clearAllFilters">پاک کردن فیلترها</button>
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

        <FilterMobileDrawer
          v-model="mobileFilterOpen"
          :filters="filters"
          @apply="onMobileFilterApply"
          @clear="clearAllFilters"
        />
      </div>
    </div>

    <!-- ══════════════════════════════════════
         LOADING — while fetching status
    ══════════════════════════════════════ -->
    <div v-else-if="statusLoading" class="flex justify-center items-center py-40">
      <div class="w-10 h-10 rounded-full border-4 border-brand/20 border-t-brand animate-spin" aria-label="در حال بارگذاری..."/>
    </div>

    <!-- ══════════════════════════════════════
         NON-APPROVED — benefits + form
    ══════════════════════════════════════ -->
    <div v-else-if="!wholesaleStatus?.isWholesale">

      <section class="py-12 px-4">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-8">
            <h2 class="text-xl font-black text-text-primary mb-2">چرا عمده‌فروش {{ settingsStore.siteName }} شوید؟</h2>
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

        <div v-if="!auth.isLoggedIn"
             class="relative overflow-hidden bg-card rounded-3xl border border-surface-border text-center shadow-modal">
          <div class="absolute inset-0 pointer-events-none"
               style="background: radial-gradient(ellipse at 50% -20%, rgba(124,58,237,0.06) 0%, transparent 65%);" aria-hidden="true"/>
          <div class="relative px-8 py-14">
            <div class="w-20 h-20 rounded-2xl mx-auto mb-7 flex items-center justify-center text-4xl"
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

        <div v-else-if="wholesaleStatus?.status === 'pending'"
             class="bg-card rounded-3xl border border-surface-border px-8 py-12 text-center shadow-modal">
          <div class="flex items-center justify-center mb-10" role="list">
            <div v-for="(step, i) in steps" :key="i" class="flex items-center" role="listitem">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                   :style="i <= 1
                     ? 'background: linear-gradient(135deg,#f59e0b,#d97706); color:#fff; box-shadow:0 4px 14px rgba(245,158,11,.42)'
                     : 'background:var(--color-surface); color:var(--color-text-secondary); border:2px solid var(--color-border)'">
                <svg v-if="i < 1" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <div v-if="i < steps.length - 1" class="w-12 sm:w-16 h-0.5"
                   :style="i < 1 ? 'background:#f59e0b' : 'background:var(--color-border)'"/>
            </div>
          </div>
          <div class="text-5xl mb-5">⏳</div>
          <h2 class="text-xl font-black text-text-primary mb-3">درخواست در حال بررسی</h2>
          <p class="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
            تیم ما درخواست شما را بررسی می‌کند.<br>
            معمولاً تا <strong class="text-amber-600 font-bold">۲۴ ساعت کاری</strong> نتیجه اعلام می‌شود.
          </p>
        </div>

        <div v-else-if="wholesaleStatus?.status === 'rejected'">
          <div class="flex items-start gap-3 border border-red-200 rounded-2xl p-4 mb-7"
               style="background: rgba(220,38,38,0.04);" role="alert">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                 style="background: rgba(220,38,38,0.1); color: #dc2626;">✗</div>
            <div>
              <p class="text-error font-bold text-sm mb-0.5">درخواست قبلی رد شد</p>
              <p class="text-red-500/80 text-xs leading-relaxed">{{ wholesaleStatus.rejectedReason || 'اطلاعات کافی ارائه نشده بود.' }}</p>
            </div>
          </div>
          <WholesaleRequestForm @submitted="onSubmitted" />
        </div>

        <div v-else-if="auth.isLoggedIn">
          <div class="bg-card border border-surface-border rounded-2xl p-5 mb-6 shadow-card">
            <p class="text-center text-[11px] font-bold tracking-widest text-text-secondary/50 uppercase mb-5">مراحل عضویت</p>
            <div class="relative flex justify-between items-start max-w-xs mx-auto">
              <div class="absolute top-[18px] right-[calc(100%/6)] left-[calc(100%/6)] h-px z-0"
                   style="background: linear-gradient(90deg, rgba(124,58,237,0.5), rgba(109,40,217,0.12));" aria-hidden="true"/>
              <div v-for="(step, i) in howItWorks" :key="i"
                   class="flex-1 flex flex-col items-center gap-2 relative z-10 px-1">
                <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                     :style="i === 0
                       ? 'background:linear-gradient(135deg,#7c3aed,#6d28d9); color:white; box-shadow:0 4px 16px rgba(124,58,237,.42)'
                       : 'background:var(--color-bg); color:var(--color-text-secondary); border:2px solid var(--color-border)'">
                  <svg v-if="i === 0" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                  </svg>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <p class="text-[11px] text-center leading-snug"
                   :class="i === 0 ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'">{{ step }}</p>
              </div>
            </div>
          </div>

          <div class="bg-card border border-surface-border rounded-3xl overflow-hidden shadow-modal">
            <div class="flex items-center gap-4 px-7 py-6"
                 style="background:linear-gradient(135deg,rgba(124,58,237,.07),rgba(109,40,217,.02)); border-bottom:1px solid rgba(124,58,237,.1);">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                   style="background:linear-gradient(135deg,#7c3aed,#6d28d9); box-shadow:0 6px 20px rgba(124,58,237,.38);">🏢</div>
              <div>
                <h2 class="text-lg font-extrabold text-text-primary mb-0.5">درخواست عضویت عمده‌فروشی</h2>
                <p class="text-xs text-text-secondary">اطلاعات کسب‌وکار خود را وارد کنید</p>
              </div>
            </div>
            <div class="px-6 py-7">
              <WholesaleRequestForm @submitted="onSubmitted" />
            </div>
          </div>

          <div class="flex flex-wrap gap-2 justify-center mt-5">
            <span v-for="badge in trustBadges" :key="badge"
                  class="text-xs text-text-secondary bg-surface border border-surface-border px-3 py-1.5 rounded-full">
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
      <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[100px] opacity-20"
             style="background: radial-gradient(ellipse, #f59e0b 0%, #d97706 40%, transparent 75%);"/>
        <div class="absolute inset-0 opacity-[0.03]"
             style="background-image:linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px);background-size:48px 48px;"/>
      </div>
      <div class="relative px-4 pt-14 pb-12 max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase"
             style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.28); color:#fbbf24;">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true"/>
          B2B · فروش عمده تخصصی
        </div>
        <h2 class="font-black text-white leading-tight mb-4" style="font-size:clamp(1.8rem,4.5vw,2.8rem);">
          فروش عمده
          <span style="background:linear-gradient(90deg,#f59e0b,#fde68a); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
            {{ settingsStore.siteName }}
          </span>
        </h2>
        <p class="text-white/50 mb-10">قیمت‌های ویژه عمده · حداقل سفارش مشخص · پشتیبانی اختصاصی B2B</p>
        <div class="grid grid-cols-3 gap-3 max-w-md mx-auto">
          <div v-for="f in heroFeatures" :key="f.label"
               class="rounded-2xl px-3 py-4 text-center"
               style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);">
            <div class="text-2xl mb-1.5">{{ f.emoji }}</div>
            <div class="text-white text-xs font-bold">{{ f.label }}</div>
            <div class="text-white/35 text-[10px] mt-0.5">{{ f.sub }}</div>
          </div>
        </div>
        <div class="mt-10 grid grid-cols-3 max-w-sm mx-auto gap-px overflow-hidden rounded-xl"
             style="background:rgba(255,255,255,0.08);">
          <div v-for="s in stats" :key="s.label" class="flex flex-col items-center py-4" style="background:rgba(255,255,255,0.03);">
            <div class="font-black text-lg font-fanum" style="color:#fbbf24;">{{ s.value }}</div>
            <div class="text-white/40 text-[10px] mt-0.5">{{ s.label }}</div>
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

const heroFeatures = [
  { emoji: '🏷️', label: 'تا ۳۵٪ تخفیف',  sub: 'نسبت به قیمت خرده' },
  { emoji: '🚚', label: 'ارسال رایگان',  sub: 'برای سفارش‌های عمده' },
  { emoji: '🤝', label: 'پشتیبانی B2B', sub: 'اختصاصی و سریع' },
]
const stats = [
  { value: '+۱۲۰۰', label: 'محصول عمده' },
  { value: '+۱۵۰',  label: 'برند فعال'  },
  { value: '۲۴ ساعت', label: 'تحویل سریع' },
]
const benefits = [
  { emoji: '💰', label: 'قیمت ویژه عمده',    desc: 'تا ۳۵٪ ارزان‌تر از خرده‌فروشی' },
  { emoji: '📦', label: 'حداقل سفارش شفاف', desc: 'بدون ابهام در تعداد سفارش'      },
  { emoji: '🚚', label: 'ارسال رایگان',      desc: 'از آستانه سفارش مشخص'          },
  { emoji: '📞', label: 'مشاور اختصاصی',    desc: 'پشتیبانی B2B مستقیم'           },
]
const steps      = ['ثبت', 'بررسی', 'تأیید']
const howItWorks = ['فرم را تکمیل کنید', 'منتظر تأیید بمانید', 'با قیمت عمده بخرید']
const trustBadges = ['🔒 اطلاعات محفوظ', '⚡ بررسی تا ۲۴ ساعت', '✓ بدون تعهد اولیه']

// view: 'browse' | 'products'
const view = ref('browse')

const wholesaleStatus = ref(null)
const statusLoading   = ref(auth.isLoggedIn)

onMounted(async () => {
  if (!auth.isLoggedIn) return
  try {
    const { data } = await http.get('/users/me/wholesale-status')
    wholesaleStatus.value = data
  } catch {
    wholesaleStatus.value = {}
  } finally {
    statusLoading.value = false
  }
})

function onSubmitted() {
  wholesaleStatus.value = { status: 'pending' }
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fa-IR') : ''
}

// ── Categories ────────────────────────────────────────────────
const categories       = ref([])
const selectedCategory = ref(null)

onMounted(async () => {
  try {
    const { data } = await http.get('/categories', { params: { level: 1, limit: 20 } })
    categories.value = data?.items ?? data?.categories ?? data ?? []
  } catch {}
})

function selectCategory(cat) {
  selectedCategory.value = cat
  brandSearch.value      = ''
  loadBrands()
}

// ── Category carousel ─────────────────────────────────────────
const catStripRef    = ref(null)
const canScrollLeft  = ref(false)
const canScrollRight = ref(false)

function onCatScroll() {
  const el = catStripRef.value
  if (!el) return
  canScrollLeft.value  = el.scrollLeft > 8
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 8
}

function scrollCats(dir) {
  const el = catStripRef.value
  if (!el) return
  el.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
}

onMounted(() => {
  nextTick(() => {
    const el = catStripRef.value
    if (!el) return
    canScrollRight.value = el.scrollWidth > el.clientWidth + 8
    el.addEventListener('scroll', onCatScroll, { passive: true })
  })
})

// ── Brands ────────────────────────────────────────────────────
const allBrands     = ref([])
const brandsLoading = ref(false)
const brandSearch   = ref('')

const displayedBrands = computed(() => {
  const q = brandSearch.value.trim().toLowerCase()
  if (!q) return allBrands.value
  return allBrands.value.filter(b => b.name.toLowerCase().includes(q))
})

async function loadBrands() {
  brandsLoading.value = true
  try {
    const { data } = await http.get('/brands')
    allBrands.value = Array.isArray(data) ? data : (data?.items ?? [])
  } catch {
    allBrands.value = []
  } finally {
    brandsLoading.value = false
  }
}

onMounted(() => loadBrands())

// ── Brand → products ──────────────────────────────────────────
const selectedBrand = ref(null)

function selectBrand(brand) {
  selectedBrand.value = brand
  filters.brand       = brand.slug
  filters.category    = selectedCategory.value?._id ?? ''
  page.value          = 1
  view.value          = 'products'
  fetchWholesaleProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function backToBrowse() {
  view.value          = 'browse'
  selectedBrand.value = null
  filters.brand       = ''
}

// ── Search ────────────────────────────────────────────────────
const searchQuery = ref('')
let   searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchWholesaleProducts() }, 420)
}

// ── Product filters ───────────────────────────────────────────
const filters = reactive({
  sortBy: 'newest', brand: '', category: '',
  minPrice: null, maxPrice: null, inStock: false,
  genders: [], frameShapes: [], frameMaterials: [],
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
    status: 'active', hasWholesalePrice: true,
    page: page.value, limit: LIMIT, sort: filters.sortBy,
    ...(searchQuery.value              ? { search:        searchQuery.value              } : {}),
    ...(filters.brand                  ? { brand:         filters.brand                  } : {}),
    ...(filters.category               ? { category:      filters.category               } : {}),
    ...(filters.minPrice               ? { minPrice:      filters.minPrice               } : {}),
    ...(filters.maxPrice               ? { maxPrice:      filters.maxPrice               } : {}),
    ...(filters.inStock                ? { inStock:       true                           } : {}),
    ...(filters.genders?.length        ? { gender:        filters.genders.join(',')      } : {}),
    ...(filters.frameShapes?.length    ? { frameShape:    filters.frameShapes.join(',')  } : {}),
    ...(filters.frameMaterials?.length ? { frameMaterial: filters.frameMaterials.join(',') } : {}),
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
    sortBy: 'newest', brand: '', category: '', minPrice: null, maxPrice: null,
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
</script>

<style scoped>
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
