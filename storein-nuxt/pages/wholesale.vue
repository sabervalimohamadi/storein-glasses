<template>
  <div class="bg-bg min-h-screen">

    <!-- ══════════════════════════════════════
         PRE-MOUNT — SSR-safe spinner
         (server and client render identically
          until onMounted fires)
    ══════════════════════════════════════ -->
    <div v-if="!isMounted" class="min-h-[60vh] flex items-center justify-center">
      <div class="w-10 h-10 rounded-full border-4 border-brand/20 border-t-brand animate-spin" aria-label="در حال بارگذاری..."/>
    </div>

    <template v-else>

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

      <!-- ── Category Section ── -->
      <div class="py-10 px-4" style="border-bottom:1px solid var(--color-border);">
        <div class="max-w-6xl mx-auto">

          <!-- Header -->
          <div class="text-right mb-6">
            <h2 class="text-xl font-black text-text-primary tracking-tight">دسته‌بندی‌ها</h2>
            <p class="text-xs mt-1 text-text-secondary">انتخاب کنید و محصولات را ببینید</p>
          </div>

          <!-- Category + subcategory — Instagram story circles -->
          <div class="relative">

            <!-- Floating left button — centered on the 64px circles (8px top padding + 32px = 40px) -->
            <button v-show="canScrollLeft" @click="scrollCats('left')" aria-label="بعدی"
                    class="absolute left-1 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                    style="top:40px; transform:translateY(-50%); background:rgb(var(--color-brand-rgb)); color:#fff; box-shadow:0 4px 16px rgba(var(--color-brand-rgb),0.45);">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <!-- Floating right button -->
            <button v-show="canScrollRight" @click="scrollCats('right')" aria-label="قبلی"
                    class="absolute right-1 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                    style="top:40px; transform:translateY(-50%); background:rgb(var(--color-brand-rgb)); color:#fff; box-shadow:0 4px 16px rgba(var(--color-brand-rgb),0.45);">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

          <div ref="catStripRef" class="flex gap-5 overflow-x-auto items-start" style="scrollbar-width:none; padding: 8px 52px 12px;">

            <!-- Skeleton -->
            <template v-if="catCardsLoading">
              <div v-for="n in 6" :key="n" class="shrink-0 flex flex-col items-center gap-2">
                <div class="w-16 h-16 rounded-full animate-pulse" style="background:var(--color-surface);"/>
                <div class="w-12 h-2.5 rounded-full animate-pulse" style="background:var(--color-surface);"/>
              </div>
            </template>

            <template v-else>

              <!-- Root category circles — first in LTR = leftmost -->
              <button @click="selectCategory(null)"
                      class="shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform duration-150">
                <div class="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200"
                     :style="!selectedCategory && !selectedSubcategory
                       ? 'background:linear-gradient(135deg,#7c3aed,#6d28d9); box-shadow:0 0 0 3px var(--color-bg),0 0 0 5.5px #7c3aed;'
                       : 'background:var(--color-surface); box-shadow:0 0 0 3px var(--color-bg),0 0 0 5.5px var(--color-border);'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7"
                       :style="!selectedCategory && !selectedSubcategory ? 'color:#e9d5ff;' : 'color:var(--color-text-secondary);'">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                  </svg>
                </div>
                <span class="text-[11px] font-bold text-center leading-tight line-clamp-2" style="width:64px;"
                      :class="!selectedCategory && !selectedSubcategory ? 'text-violet-400' : 'text-text-primary'">همه دسته‌ها</span>
              </button>

              <button v-for="cat in rootCatsWithStock" :key="cat._id"
                      @click="selectCategory(cat)"
                      class="shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform duration-150">
                <div class="w-16 h-16 rounded-full overflow-hidden transition-all duration-200"
                     :style="selectedCategory?._id === cat._id && !selectedSubcategory
                       ? 'box-shadow:0 0 0 3px var(--color-bg),0 0 0 5.5px #7c3aed;'
                       : 'box-shadow:0 0 0 3px var(--color-bg),0 0 0 5.5px var(--color-border);'">
                  <img v-if="cat.image" :src="cat.image" :alt="cat.name" class="w-full h-full object-cover"/>
                  <div v-else class="w-full h-full flex items-center justify-center"
                       :style="`background:linear-gradient(145deg,${catMeta(cat.slug).g1},${catMeta(cat.slug).g2});`">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8"
                         :style="`color:${catMeta(cat.slug).iconFg};`">
                      <template v-if="catMeta(cat.slug).icon==='sunglasses'">
                        <rect x="2" y="9" width="8" height="6" rx="3"/><rect x="14" y="9" width="8" height="6" rx="3"/><path d="M10 12h4"/>
                      </template>
                      <template v-else-if="catMeta(cat.slug).icon==='glasses'">
                        <circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/><path d="M11 12h2"/>
                      </template>
                      <template v-else-if="catMeta(cat.slug).icon==='lens'">
                        <circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>
                      </template>
                      <template v-else-if="catMeta(cat.slug).icon==='case'">
                        <rect x="2" y="8" width="20" height="12" rx="4"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>
                      </template>
                      <template v-else>
                        <rect x="2" y="9" width="8" height="6" rx="3"/><rect x="14" y="9" width="8" height="6" rx="3"/><path d="M10 12h4"/>
                      </template>
                    </svg>
                  </div>
                </div>
                <span class="text-[11px] font-bold text-center leading-tight line-clamp-2" style="width:64px;"
                      :class="selectedCategory?._id === cat._id && !selectedSubcategory ? 'text-violet-400' : 'text-text-primary'">{{ cat.name }}</span>
              </button>

              <!-- Divider + subcategory circles — after root cats -->
              <template v-if="visibleSubcategories.length">
                <div class="shrink-0 self-stretch flex items-center px-0.5">
                  <div class="w-px h-16 rounded-full" style="background:var(--color-border);"/>
                </div>

<button v-for="sub in visibleSubcategories" :key="sub._id"
                        @click="selectSubcategory(sub)"
                        class="shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform duration-150">
                  <div class="w-14 h-14 rounded-full overflow-hidden transition-all duration-200"
                       :style="selectedSubcategory?._id === sub._id
                         ? 'box-shadow:0 0 0 2.5px var(--color-bg),0 0 0 5px #7c3aed;'
                         : 'box-shadow:0 0 0 2.5px var(--color-bg),0 0 0 5px var(--color-border);'">
                    <img v-if="sub.image" :src="sub.image" :alt="sub.name" class="w-full h-full object-cover"/>
                    <div v-else class="w-full h-full flex items-center justify-center"
                         :style="selectedSubcategory?._id === sub._id ? 'background:rgba(124,58,237,0.18);' : 'background:var(--color-surface);'">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"
                           :style="selectedSubcategory?._id === sub._id ? 'color:#a78bfa;' : 'color:var(--color-text-secondary);'">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                    </div>
                  </div>
                  <span class="text-[11px] font-bold text-center leading-tight line-clamp-2" style="width:56px;"
                        :class="selectedSubcategory?._id === sub._id ? 'text-violet-400' : 'text-text-primary'">{{ sub.name }}</span>
                </button>
              </template>

            </template>
          </div>
          </div><!-- /relative wrapper -->

          <!-- ── Brand strip (below categories) ── -->
          <div class="mt-7 pt-6 border-t" style="border-color:var(--color-border);">
            <div class="flex items-center justify-between mb-4">
              <p class="text-xs font-bold text-text-secondary">
                {{ selectedCategory ? `برندهای ${selectedCategory.name}` : 'همه برندها' }}
                <span v-if="!brandsLoading" class="mr-1.5 opacity-50 font-normal">({{ displayedBrands.length }} برند)</span>
              </p>
              <button v-if="selectedBrand" @click="clearBrandSelection"
                      class="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 shrink-0">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                پاک‌کردن
              </button>
            </div>

            <!-- Skeleton -->
            <div v-if="brandsLoading" class="flex gap-3 overflow-hidden" style="padding:4px 0 8px;">
              <div v-for="n in 8" :key="n" class="shrink-0 w-28 h-[76px] rounded-2xl animate-pulse" style="background:var(--color-surface);"/>
            </div>

            <!-- Empty -->
            <div v-else-if="!displayedBrands.length" class="flex items-center gap-2 py-3 text-sm text-text-secondary">
              <span>🏷️</span> برندی برای این دسته‌بندی یافت نشد
            </div>

            <!-- Brand scroll strip -->
            <div v-else class="relative">
              <button v-show="canScrollBrandLeft" @click="scrollBrands('left')"
                      class="absolute left-1 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                      style="top:38px; transform:translateY(-50%); background:rgb(var(--color-brand-rgb)); color:#fff; box-shadow:0 4px 14px rgba(var(--color-brand-rgb),0.4);">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button v-show="canScrollBrandRight" @click="scrollBrands('right')"
                      class="absolute right-1 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                      style="top:38px; transform:translateY(-50%); background:rgb(var(--color-brand-rgb)); color:#fff; box-shadow:0 4px 14px rgba(var(--color-brand-rgb),0.4);">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>

              <div ref="brandStripRef" class="flex gap-3 overflow-x-auto" style="scrollbar-width:none; padding:4px 48px 8px;">
                <button v-for="brand in displayedBrands" :key="brand._id ?? brand.slug"
                        @click="selectBrand(brand)"
                        class="shrink-0 min-w-[108px] flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-3 transition-all duration-200 active:scale-95 hover:-translate-y-0.5 hover:shadow-md"
                        :style="selectedBrand?.slug === brand.slug
                          ? 'border:2px solid rgb(var(--color-brand-rgb)); background:rgba(var(--color-brand-rgb),0.06);'
                          : 'border:1.5px solid var(--color-border); background:var(--color-card);'">
                  <div class="h-9 flex items-center justify-center w-full">
                    <img v-if="brand.logo" :src="brand.logo" :alt="brand.name" class="max-h-9 max-w-[88px] object-contain"/>
                    <span v-else class="font-black text-sm text-center leading-tight"
                          :class="selectedBrand?.slug === brand.slug ? 'text-brand' : 'text-text-primary'">{{ brand.name }}</span>
                  </div>
                  <span v-if="brand.logo" class="text-[10px] font-semibold text-center leading-tight line-clamp-1 w-full"
                        :class="selectedBrand?.slug === brand.slug ? 'text-brand/80' : 'text-text-secondary'">{{ brand.name }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ── Inline product results ── -->
          <div v-if="selectedBrand" id="ws-products" class="mt-7 pt-6 border-t" style="border-color:var(--color-border);">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5 min-w-0">
                <img v-if="selectedBrand.logo" :src="selectedBrand.logo" class="h-6 object-contain shrink-0" :alt="selectedBrand.name"/>
                <span class="font-bold text-sm text-text-primary truncate">{{ selectedBrand.name }}</span>
                <span v-if="!productsLoading" class="text-xs text-text-secondary shrink-0 opacity-60">({{ total }} محصول)</span>
              </div>
            </div>

            <SortBar v-model="filters.sortBy" :total="total" :loading="productsLoading"
                     @update:modelValue="onSortChange" @open-filter="mobileFilterOpen = true"/>

            <div v-if="!productsLoading && wholesaleProducts.length === 0"
                 class="flex flex-col items-center py-16 text-center mt-4 rounded-2xl border"
                 style="background:var(--color-card); border-color:var(--color-border);">
              <div class="text-3xl mb-3">🔍</div>
              <p class="font-bold text-text-primary text-sm mb-1">محصولی یافت نشد</p>
              <p class="text-xs text-text-secondary">برای این برند محصول عمده‌ای موجود نیست</p>
            </div>

            <WholesaleProductGrid v-else :products="wholesaleProducts" :loading="productsLoading"/>

            <BasePagination :model-value="page" :total-pages="totalPages" :loading="productsLoading"
                            @update:modelValue="onPageChange" class="mt-6"/>

            <FilterMobileDrawer v-model="mobileFilterOpen" :filters="filters"
                                @apply="onMobileFilterApply" @clear="clearAllFilters"/>
          </div>

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

    </template><!-- end v-else (isMounted) -->

    <!-- ══════════════════════════════════════
         HERO (bottom) — always rendered
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

const isMounted       = ref(false)
const wholesaleStatus = ref(null)
const statusLoading   = ref(false)

onMounted(async () => {
  isMounted.value = true
  if (!auth.isLoggedIn) return
  statusLoading.value = true
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

// ── Category cards ────────────────────────────────────────────
const CAT_META = {
  sunglasses:    { g1:'#0f3d73', g2:'#1b4f8a', shadow:'rgba(27,79,138,0.5)',  iconBg:'rgba(74,158,255,0.2)',  iconFg:'#93c5fd', icon:'sunglasses' },
  prescription:  { g1:'#1a3a2a', g2:'#2d6a4f', shadow:'rgba(45,106,79,0.5)',  iconBg:'rgba(52,211,153,0.2)',  iconFg:'#6ee7b7', icon:'glasses'    },
  'contact-lens':{ g1:'#2d1b69', g2:'#4c1d95', shadow:'rgba(109,40,217,0.5)', iconBg:'rgba(167,139,250,0.2)', iconFg:'#c4b5fd', icon:'lens'        },
  accessories:   { g1:'#831843', g2:'#9d174d', shadow:'rgba(157,23,77,0.5)',  iconBg:'rgba(249,168,212,0.2)', iconFg:'#f9a8d4', icon:'case'        },
  men:           { g1:'#1e3a5f', g2:'#1d4ed8', shadow:'rgba(29,78,216,0.5)',  iconBg:'rgba(96,165,250,0.2)',  iconFg:'#93c5fd', icon:'glasses'     },
  women:         { g1:'#581c87', g2:'#7c3aed', shadow:'rgba(124,58,237,0.5)', iconBg:'rgba(192,132,252,0.2)', iconFg:'#e9d5ff', icon:'glasses'     },
  kids:          { g1:'#7c2d12', g2:'#c2410c', shadow:'rgba(194,65,12,0.5)',  iconBg:'rgba(251,146,60,0.2)',  iconFg:'#fed7aa', icon:'case'        },
}
const DEFAULT_META = { g1:'#1e293b', g2:'#334155', shadow:'rgba(51,65,85,0.5)', iconBg:'rgba(255,255,255,0.1)', iconFg:'rgba(255,255,255,0.6)', icon:'glasses' }

function catMeta(slug) { return CAT_META[slug] ?? DEFAULT_META }

const rootCatsWithStock  = ref([])
const categoryTree       = ref([])
const catCardsLoading    = ref(false)
const selectedCategory   = ref(null)
const selectedSubcategory = ref(null)
const catStripRef        = ref(null)
const canScrollLeft      = ref(false)
const canScrollRight     = ref(true)

const totalCatStock = computed(() =>
  rootCatsWithStock.value.reduce((sum, c) => sum + (c.totalStock ?? 0), 0),
)

const allSubcategories = computed(() => {
  const result = []
  for (const root of categoryTree.value) {
    if (root.children?.length) result.push(...root.children)
  }
  return result
})

const visibleSubcategories = computed(() => allSubcategories.value)

onMounted(async () => {
  catCardsLoading.value = true
  try {
    const [stockRes, treeRes] = await Promise.all([
      http.get('/categories/roots-with-stock'),
      http.get('/categories/tree'),
    ])
    rootCatsWithStock.value = Array.isArray(stockRes.data) ? stockRes.data : (stockRes.data?.data ?? [])
    categoryTree.value      = Array.isArray(treeRes.data)  ? treeRes.data  : (treeRes.data?.data  ?? [])
  } catch {
    rootCatsWithStock.value = []
  } finally {
    catCardsLoading.value = false
    nextTick(() => {
      const el = catStripRef.value
      if (!el) return
      const max = el.scrollWidth - el.clientWidth
      canScrollRight.value = max > 8
      canScrollLeft.value  = false
      el.addEventListener('scroll', () => {
        // RTL: scrollLeft is negative in Chrome, positive in Firefox
        const pos = el.scrollLeft
        const absPos = Math.abs(pos)
        canScrollLeft.value  = absPos > 8 || pos > 8
        canScrollRight.value = absPos < max - 8
      }, { passive: true })
    })
  }
})

function selectCategory(cat) {
  selectedCategory.value    = cat
  selectedSubcategory.value = null
  brandSearch.value         = ''
  clearBrandSelection()
  loadBrands()
}

function selectSubcategory(sub) {
  if (selectedSubcategory.value?._id === sub._id) {
    // toggle off → fall back to parent category
    selectedSubcategory.value = null
    filters.category = selectedCategory.value?._id ?? ''
  } else {
    selectedSubcategory.value = sub
    filters.category = sub._id
  }
  page.value = 1
  clearBrandSelection()
  loadBrands()
}

function scrollCats(dir) {
  const el = catStripRef.value
  if (!el) return
  // RTL: scrollLeft is 0 at right end and goes negative toward left.
  // "left" button = scroll strip LEFT = see content on the right (negative delta in RTL)
  // "right" button = scroll strip RIGHT = see content on the left (positive delta in RTL)
  el.scrollBy({ left: dir === 'left' ? 240 : -240, behavior: 'smooth' })
  nextTick(() => {
    const pos = el.scrollLeft   // negative in Chrome RTL, positive toward 0
    const max = el.scrollWidth - el.clientWidth
    canScrollLeft.value  = pos < -8
    canScrollRight.value = Math.abs(pos) < max - 8
  })
}

// ── Brands ────────────────────────────────────────────────────
const allBrands     = ref([])
const brandsLoading = ref(false)
const brandSearch   = ref('')
const brandStripRef       = ref(null)
const canScrollBrandLeft  = ref(false)
const canScrollBrandRight = ref(true)

const displayedBrands = computed(() => {
  const q = brandSearch.value.trim().toLowerCase()
  if (!q) return allBrands.value
  return allBrands.value.filter(b => b.name.toLowerCase().includes(q))
})

function scrollBrands(dir) {
  const el = brandStripRef.value
  if (!el) return
  el.scrollBy({ left: dir === 'left' ? 240 : -240, behavior: 'smooth' })
  nextTick(() => {
    const pos = el.scrollLeft
    const max = el.scrollWidth - el.clientWidth
    canScrollBrandLeft.value  = pos < -8 || pos > 8
    canScrollBrandRight.value = Math.abs(pos) < max - 8
  })
}

async function loadBrands() {
  brandsLoading.value = true
  try {
    const params = { hasWholesalePrice: true }
    const activeCat = selectedSubcategory.value ?? selectedCategory.value
    if (activeCat) params.category = activeCat._id
    const { data } = await http.get('/products/brands', { params })
    allBrands.value = Array.isArray(data) ? data : (data?.items ?? [])
  } catch {
    allBrands.value = []
  } finally {
    brandsLoading.value = false
    nextTick(() => {
      const el = brandStripRef.value
      if (!el) return
      const max = el.scrollWidth - el.clientWidth
      canScrollBrandRight.value = max > 8
      canScrollBrandLeft.value  = false
      el.addEventListener('scroll', () => {
        const pos = el.scrollLeft
        canScrollBrandLeft.value  = Math.abs(pos) > 8 || pos > 8
        canScrollBrandRight.value = Math.abs(pos) < max - 8
      }, { passive: true })
    })
  }
}

onMounted(() => loadBrands())

// ── Brand → products ──────────────────────────────────────────
const selectedBrand = ref(null)

async function selectBrand(brand) {
  if (selectedBrand.value?.slug === brand.slug) {
    clearBrandSelection()
    return
  }
  selectedBrand.value = brand
  filters.brand       = brand._id ?? brand.slug
  filters.category    = selectedSubcategory.value?._id ?? selectedCategory.value?._id ?? ''
  page.value          = 1
  await fetchWholesaleProducts()
  nextTick(() => {
    document.getElementById('ws-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function clearBrandSelection() {
  selectedBrand.value     = null
  filters.brand           = ''
  wholesaleProducts.value = []
  total.value             = 0
}

function backToBrowse() {
  view.value = 'browse'
  clearBrandSelection()
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
  document.getElementById('ws-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped>
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
.sub-fade-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.sub-fade-leave-active { transition: opacity 0.15s ease; }
.sub-fade-enter-from   { opacity: 0; transform: translateY(-6px); }
.sub-fade-leave-to     { opacity: 0; }
</style>
