<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="page-title">تنظیمات سایت</h1>
        <p class="text-text-secondary text-sm mt-0.5">عنوان، لوگو، سئو، شبکه‌های اجتماعی و فوتر</p>
      </div>
      <AdminButton :loading="saving" :disabled="!dirty" @click="saveAll">
        {{ dirty ? '✓ ذخیره تغییرات' : 'ذخیره‌شده ✓' }}
      </AdminButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <AdminSkeleton v-for="i in 4" :key="i" height="80px" class="rounded-xl" />
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="flex items-center gap-1 mb-6 bg-surface p-1 rounded-xl w-fit flex-wrap">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === tab.key
              ? 'bg-card text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          ]"
        >
          <span>{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- ── Tab: عمومی ──────────────────────────────────── -->
      <div v-show="activeTab === 'general'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">اطلاعات عمومی سایت</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput v-model="form.siteName"
              label="نام سایت" placeholder="استورین" required
              hint="در تب مرورگر و عنوان صفحات نمایش داده می‌شود" />
            <AdminInput v-model="form.tagline"
              label="شعار سایت" placeholder="فروشگاه تخصصی عینک‌های طبی و آفتابی"
              hint="زیر نام سایت در فوتر نمایش داده می‌شود" />
          </div>

          <!-- Logo upload -->
          <div>
            <label class="field-label">لوگو سایت</label>
            <div class="flex items-center gap-4 mt-2">
              <div class="w-24 h-16 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="form.logoUrl" :src="form.logoUrl" class="w-full h-full object-contain p-1" />
                <span v-else class="text-3xl">🖼</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex gap-2">
                  <AdminInput v-model="form.logoUrl" dir="ltr" placeholder="https://..." class="flex-1" />
                  <AdminButton variant="secondary" :loading="uploading.logo" @click="triggerUpload('logo')">
                    📷 آپلود
                  </AdminButton>
                </div>
                <p class="text-xs text-text-disabled">پیشنهاد: PNG با پس‌زمینه شفاف، ارتفاع ۱۲۰px</p>
              </div>
            </div>
          </div>

          <!-- Favicon upload -->
          <div>
            <label class="field-label">فاوآیکون (Favicon)</label>
            <div class="flex items-center gap-4 mt-2">
              <div class="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="form.faviconUrl" :src="form.faviconUrl" class="w-8 h-8 object-contain" />
                <span v-else class="text-2xl">🌐</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex gap-2">
                  <AdminInput v-model="form.faviconUrl" dir="ltr" placeholder="https://..." class="flex-1" />
                  <AdminButton variant="secondary" :loading="uploading.favicon" @click="triggerUpload('favicon')">
                    📷 آپلود
                  </AdminButton>
                </div>
                <p class="text-xs text-text-disabled">پیشنهاد: ICO یا PNG مربعی ۳۲×۳۲ یا ۶۴×۶۴</p>
              </div>
            </div>
          </div>

          <input ref="fileInputLogo"    type="file" accept="image/*" class="hidden" @change="onFileChange($event, 'logo')" />
          <input ref="fileInputFavicon" type="file" accept="image/png,image/x-icon,image/svg+xml" class="hidden" @change="onFileChange($event, 'favicon')" />
        </div>
      </div>

      <!-- ── Tab: تم سایت ─────────────────────────────────── -->
      <div v-show="activeTab === 'theme'" class="space-y-5">
        <div class="admin-card space-y-6">
          <h3 class="section-title">رنگ اصلی سایت</h3>
          <p class="text-text-secondary text-sm -mt-3">
            این رنگ روی دکمه‌ها، لینک‌ها، بج‌ها و المان‌های تعاملی سایت اصلی اعمال می‌شود.
          </p>

          <!-- Preset grid -->
          <div class="grid grid-cols-5 sm:grid-cols-6 gap-3">
            <button
              v-for="preset in colorPresets"
              :key="preset.key"
              @click="selectPreset(preset)"
              :class="[
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                form.theme.preset === preset.key
                  ? 'border-primary scale-105 shadow-md'
                  : 'border-border hover:border-primary/40',
              ]"
            >
              <!-- Swatch -->
              <div class="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center overflow-hidden"
                   :style="preset.color ? `background:${preset.color}` : 'background: conic-gradient(red,yellow,lime,aqua,blue,magenta,red)'">
                <svg v-if="form.theme.preset === preset.key"
                     class="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span class="text-[11px] text-text-secondary font-medium">{{ preset.label }}</span>
            </button>
          </div>

          <!-- Custom color picker (shown only when preset = custom) -->
          <Transition name="slide-down">
            <div v-if="form.theme.preset === 'custom'" class="space-y-3 pt-1">
              <label class="field-label">رنگ سفارشی (Hex)</label>
              <div class="flex items-center gap-3">
                <input
                  type="color"
                  v-model="form.theme.primaryColor"
                  class="w-12 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                />
                <AdminInput
                  v-model="form.theme.primaryColor"
                  dir="ltr"
                  placeholder="#3B82F6"
                  class="flex-1"
                  hint="فرمت hex — مثال: #3B82F6"
                />
              </div>
            </div>
          </Transition>

          <!-- Default mode -->
          <div class="space-y-3 pt-2 border-t border-border">
            <p class="text-xs font-bold text-text-disabled uppercase tracking-wider pt-2">حالت پیش‌فرض سایت</p>
            <p class="text-text-secondary text-sm">
              بازدیدکنندگانی که تنظیم خاصی ندارند با این حالت وارد سایت می‌شوند.
            </p>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="mode in displayModes"
                :key="mode.key"
                @click="form.theme.defaultMode = mode.key"
                :class="[
                  'relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all',
                  form.theme.defaultMode === mode.key
                    ? 'border-primary shadow-md scale-105'
                    : 'border-border hover:border-primary/40',
                ]"
              >
                <!-- Mini screen mockup -->
                <div :class="[
                  'w-full h-16 rounded-lg border border-black/10 overflow-hidden relative',
                  mode.key === 'dark' ? 'bg-slate-900'
                  : mode.key === 'light' ? 'bg-white'
                  : 'bg-gradient-to-bl from-white to-slate-900',
                ]">
                  <!-- Fake header bar -->
                  <div :class="[
                    'h-4 w-full flex items-center px-2 gap-1',
                    mode.key === 'dark' ? 'bg-slate-800' : mode.key === 'light' ? 'bg-slate-100' : 'bg-slate-400/50'
                  ]">
                    <div class="w-2 h-2 rounded-full" :style="`background:${activePresetColor}`"></div>
                    <div :class="['h-1.5 rounded-full flex-1', mode.key === 'dark' ? 'bg-slate-700' : 'bg-slate-200']"></div>
                  </div>
                  <!-- Fake content lines -->
                  <div class="p-2 space-y-1">
                    <div :class="['h-1.5 rounded-full w-3/4', mode.key === 'dark' ? 'bg-slate-700' : 'bg-slate-200']"></div>
                    <div :class="['h-1.5 rounded-full w-1/2', mode.key === 'dark' ? 'bg-slate-700' : 'bg-slate-200']"></div>
                    <div class="h-4 rounded-md w-1/3 mt-1" :style="`background:${activePresetColor}; opacity:0.85`"></div>
                  </div>
                  <!-- System half overlay -->
                  <div v-if="mode.key === 'system'"
                       class="absolute inset-0 flex">
                    <div class="w-1/2 h-full bg-white/30"></div>
                    <div class="w-1/2 h-full bg-slate-900/30"></div>
                  </div>
                </div>
                <div class="text-center">
                  <p class="text-sm font-semibold text-text-primary">{{ mode.label }}</p>
                  <p class="text-[11px] text-text-disabled mt-0.5">{{ mode.desc }}</p>
                </div>
                <!-- Check -->
                <div v-if="form.theme.defaultMode === mode.key"
                     class="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center"
                     :style="`background:${activePresetColor}`">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

        </div>

        <!-- ── Section Colors card ── -->
        <div class="admin-card space-y-6">
          <div>
            <h3 class="section-title">رنگ‌بندی بخش‌های مختلف سایت</h3>
            <p class="text-text-secondary text-sm mt-1">
              رنگ هر بخش را جداگانه تنظیم کنید. دکمه «پیش‌فرض» رنگ را به حالت اولیه بازمی‌گرداند.
            </p>
          </div>

          <!-- Navbar -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🔝</span>
                <div>
                  <p class="text-sm font-semibold text-text-primary">هدر / ناوبار</p>
                  <p class="text-xs text-text-secondary">پس‌زمینه نوار بالای سایت اصلی</p>
                </div>
              </div>
              <button
                v-if="form.theme.navbarBg"
                @click="form.theme.navbarBg = ''; form.theme.navbarBorder = ''"
                class="text-xs text-text-secondary hover:text-error transition-colors px-2 py-1 rounded-lg hover:bg-error/10"
              >↺ پیش‌فرض</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="field-label text-xs">رنگ پس‌زمینه</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="color" v-model="form.theme.navbarBg"
                    class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                  <input v-model="form.theme.navbarBg" dir="ltr"
                    class="field-input flex-1 font-mono text-sm" placeholder="#FFFFFF (خالی = پیش‌فرض)" />
                </div>
              </div>
              <div>
                <label class="field-label text-xs">رنگ خط جداکننده</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="color" v-model="form.theme.navbarBorder"
                    class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                  <input v-model="form.theme.navbarBorder" dir="ltr"
                    class="field-input flex-1 font-mono text-sm" placeholder="#DDE3EC (خالی = پیش‌فرض)" />
                </div>
              </div>
            </div>
            <!-- Mini preview -->
            <div class="rounded-xl overflow-hidden border border-border">
              <div class="h-10 flex items-center px-4 gap-3"
                   :style="{ backgroundColor: form.theme.navbarBg || '#FFFFFF', borderBottom: `1px solid ${form.theme.navbarBorder || '#DDE3EC'}` }">
                <span class="font-bold text-sm" :style="{ color: navbarTextColor }">استورین</span>
                <div class="flex-1 h-5 rounded bg-gray-200/50"></div>
                <div class="w-5 h-5 rounded-full" :style="{ backgroundColor: activePresetColor }"></div>
              </div>
              <div class="h-6 bg-surface flex items-center px-4 gap-2">
                <span v-for="i in 4" :key="i" class="h-1.5 w-12 rounded-full bg-border"></span>
              </div>
            </div>
          </div>

          <div class="border-t border-border pt-5 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">📄</span>
                <div>
                  <p class="text-sm font-semibold text-text-primary">فوتر</p>
                  <p class="text-xs text-text-secondary">پس‌زمینه و رنگ متن بخش پایین سایت</p>
                </div>
              </div>
              <button
                v-if="form.theme.footerBg || form.theme.footerText"
                @click="form.theme.footerBg = ''; form.theme.footerText = ''"
                class="text-xs text-text-secondary hover:text-error transition-colors px-2 py-1 rounded-lg hover:bg-error/10"
              >↺ پیش‌فرض</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="field-label text-xs">رنگ پس‌زمینه</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="color" v-model="form.theme.footerBg"
                    class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                  <input v-model="form.theme.footerBg" dir="ltr"
                    class="field-input flex-1 font-mono text-sm" placeholder="#111827 (خالی = پیش‌فرض)" />
                </div>
              </div>
              <div>
                <label class="field-label text-xs">رنگ متن</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="color" v-model="form.theme.footerText"
                    class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                  <input v-model="form.theme.footerText" dir="ltr"
                    class="field-input flex-1 font-mono text-sm" placeholder="#D1D5DB (خالی = پیش‌فرض)" />
                </div>
              </div>
            </div>
            <!-- Mini preview -->
            <div class="rounded-xl overflow-hidden border border-border">
              <div class="h-16 px-4 py-3 flex items-start gap-4"
                   :style="{ backgroundColor: form.theme.footerBg || '#111827' }">
                <div>
                  <p class="font-bold text-sm" :style="{ color: form.theme.footerText || '#D1D5DB' }">استورین</p>
                  <p class="text-xs mt-0.5" :style="{ color: form.theme.footerText || '#9CA3AF', opacity: 0.7 }">فروشگاه تخصصی عینک</p>
                </div>
                <div class="flex-1"></div>
                <div class="text-right">
                  <p class="text-xs font-semibold" :style="{ color: form.theme.footerText || '#D1D5DB' }">دسته‌بندی‌ها</p>
                  <p class="text-xs mt-1" :style="{ color: form.theme.footerText || '#9CA3AF', opacity: 0.7 }">عینک آفتابی</p>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-border pt-5 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🗂</span>
                <div>
                  <p class="text-sm font-semibold text-text-primary">سایدبار ادمین</p>
                  <p class="text-xs text-text-secondary">رنگ منوی کناری پنل مدیریت</p>
                </div>
              </div>
              <button
                v-if="form.theme.sidebarBg"
                @click="form.theme.sidebarBg = ''"
                class="text-xs text-text-secondary hover:text-error transition-colors px-2 py-1 rounded-lg hover:bg-error/10"
              >↺ پیش‌فرض</button>
            </div>
            <div class="flex items-center gap-2">
              <input type="color" v-model="form.theme.sidebarBg"
                class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
              <input v-model="form.theme.sidebarBg" dir="ltr"
                class="field-input flex-1 font-mono text-sm" placeholder="#0F172A (خالی = پیش‌فرض)" />
            </div>
            <!-- Mini preview -->
            <div class="flex rounded-xl overflow-hidden border border-border h-24">
              <div class="w-16 flex flex-col gap-1.5 p-2"
                   :style="{ backgroundColor: form.theme.sidebarBg || '#0F172A' }">
                <div v-for="i in 4" :key="i" class="h-1.5 rounded-full bg-white/20"></div>
                <div class="h-1.5 rounded-full mt-auto" :style="{ backgroundColor: activePresetColor, opacity: 0.8 }"></div>
              </div>
              <div class="flex-1 bg-surface p-3 space-y-2">
                <div class="h-2.5 rounded-full bg-border w-3/4"></div>
                <div class="h-2 rounded-full bg-border w-1/2"></div>
                <div class="h-2 rounded-full bg-border w-2/3"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card space-y-5">
          <!-- Live preview -->
          <div class="space-y-3">
            <p class="text-xs font-bold text-text-disabled uppercase tracking-wider">پیش‌نمایش رنگ اصلی</p>
            <div class="bg-surface rounded-2xl border border-border p-5 space-y-4">

              <!-- Buttons row -->
              <div class="flex flex-wrap gap-3 items-center">
                <button class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all"
                        :style="`background:${activePresetColor}`">
                  افزودن به سبد خرید
                </button>
                <button class="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                        :style="`border-color:${activePresetColor}; color:${activePresetColor}`">
                  مشاهده محصول
                </button>
                <span class="px-3 py-1 rounded-full text-xs font-bold text-white"
                      :style="`background:${activePresetColor}`">
                  تخفیف ۲۰٪
                </span>
              </div>

              <!-- Fake product card -->
              <div class="flex items-center gap-4 bg-card rounded-xl p-4 border border-border max-w-sm">
                <div class="w-16 h-16 rounded-xl flex-shrink-0 opacity-20"
                     :style="`background:${activePresetColor}`"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 rounded-full bg-text-disabled/30 w-3/4"></div>
                  <div class="h-2.5 rounded-full bg-text-disabled/20 w-1/2"></div>
                  <p class="text-sm font-bold" :style="`color:${activePresetColor}`">
                    ۱,۲۵۰,۰۰۰ تومان
                  </p>
                </div>
              </div>

              <!-- Nav link example -->
              <div class="flex gap-4 text-sm border-b border-border pb-3">
                <span class="font-semibold border-b-2 pb-1" :style="`border-color:${activePresetColor}; color:${activePresetColor}`">
                  همه محصولات
                </span>
                <span class="text-text-secondary">عینک آفتابی</span>
                <span class="text-text-secondary">عینک طبی</span>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: سئو ────────────────────────────────────── -->
      <div v-show="activeTab === 'seo'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">تنظیمات سئو</h3>

          <AdminTextarea v-model="form.description"
            label="توضیحات متا (Meta Description)"
            placeholder="توضیح کوتاهی درباره سایت که در نتایج جستجو نمایش داده می‌شود..."
            :rows="3"
            :hint="`${form.description.length}/160 کاراکتر`" />

          <AdminInput v-model="form.keywords"
            label="کلمات کلیدی (Keywords)"
            placeholder="عینک آفتابی, عینک طبی, لنز رنگی, خرید عینک"
            hint="با کاما جدا کنید" />

          <!-- OG Image -->
          <div>
            <label class="field-label">تصویر شبکه‌های اجتماعی (OG Image)</label>
            <p class="text-xs text-text-disabled mb-2">هنگام اشتراک لینک در واتساپ، تلگرام و ... نمایش داده می‌شود</p>
            <div class="flex items-center gap-4">
              <div class="w-32 h-20 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="form.ogImage" :src="form.ogImage" class="w-full h-full object-cover" />
                <span v-else class="text-3xl">🖼</span>
              </div>
              <div class="flex-1 flex gap-2">
                <AdminInput v-model="form.ogImage" dir="ltr" placeholder="https://..." class="flex-1" />
                <AdminButton variant="secondary" :loading="uploading.ogImage" @click="triggerUpload('ogImage')">
                  📷 آپلود
                </AdminButton>
              </div>
            </div>
            <input ref="fileInputOg" type="file" accept="image/*" class="hidden" @change="onFileChange($event, 'ogImage')" />
          </div>

          <!-- SEO preview -->
          <div class="bg-surface rounded-xl p-4 border border-border">
            <p class="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wide">پیش‌نمایش نتیجه جستجو</p>
            <p class="text-[#1a0dab] dark:text-[#8ab4f8] text-lg font-medium leading-tight">
              {{ form.siteName || 'نام سایت' }}
            </p>
            <p class="text-[#006621] dark:text-[#34a853] text-xs my-0.5">storein.ir ›</p>
            <p class="text-[#545454] dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
              {{ form.description || 'توضیحات متا در اینجا نمایش داده می‌شود...' }}
            </p>
          </div>
        </div>
      </div>

      <!-- ── Tab: شبکه‌های اجتماعی ──────────────────────── -->
      <div v-show="activeTab === 'social'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">لینک‌های شبکه‌های اجتماعی</h3>
          <p class="text-text-secondary text-sm -mt-2">لینک‌های خالی در فوتر نمایش داده نخواهند شد</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div v-for="platform in socialPlatforms" :key="platform.key">
              <label class="field-label flex items-center gap-2">
                <span>{{ platform.icon }}</span>
                {{ platform.label }}
              </label>
              <AdminInput
                v-model="form.social[platform.key]"
                :placeholder="platform.placeholder"
                dir="ltr"
                class="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: فوتر ───────────────────────────────────── -->
      <div v-show="activeTab === 'footer'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">محتوای فوتر</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput v-model="form.footerTagline"
              label="شعار فوتر"
              placeholder="با بیش از هزاران محصول از برترین برندهای جهانی..."
              hint="اگر خالی باشد از شعار اصلی استفاده می‌شود" />
            <AdminInput v-model="form.footerCopyright"
              label="متن کپی‌رایت"
              placeholder="تمامی حقوق برای استورین محفوظ است" />
          </div>

          <!-- Footer links -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="field-label mb-0">لینک‌های سفارشی فوتر</label>
              <AdminButton variant="ghost" size="sm" @click="addFooterLink">
                + افزودن لینک
              </AdminButton>
            </div>

            <div v-if="!form.footerLinks.length"
                 class="py-8 text-center text-text-disabled text-sm border border-dashed border-border rounded-xl">
              هنوز لینکی اضافه نشده — دکمه بالا را بزنید
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(link, idx) in form.footerLinks"
                :key="idx"
                class="flex items-center gap-2"
              >
                <AdminInput v-model="link.label"
                  placeholder="عنوان لینک مثلاً: درباره ما"
                  class="flex-1" />
                <AdminInput v-model="link.url"
                  placeholder="/about یا https://..."
                  dir="ltr"
                  class="flex-1" />
                <button
                  @click="removeFooterLink(idx)"
                  class="w-9 h-9 flex-shrink-0 rounded-lg text-error hover:bg-error/10 flex items-center justify-center transition-colors text-sm"
                >✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: تماس ───────────────────────────────────── -->
      <div v-show="activeTab === 'contact'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">اطلاعات تماس</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput v-model="form.phone"
              label="شماره تلفن" placeholder="۰۲۱-۱۲۳۴۵۶۷۸" dir="ltr"
              hint="در فوتر سایت نمایش داده می‌شود" />
            <AdminInput v-model="form.email"
              label="ایمیل پشتیبانی" placeholder="support@storein.ir" dir="ltr" />
          </div>

          <AdminTextarea v-model="form.address"
            label="آدرس" placeholder="تهران، خیابان ..." :rows="2" />
        </div>
      </div>

      <!-- Bottom save bar (sticky) -->
      <Transition name="slide-up">
        <div v-if="dirty"
             class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border shadow-2xl rounded-2xl px-5 py-3">
          <span class="text-sm text-text-secondary">تغییرات ذخیره نشده دارید</span>
          <AdminButton variant="ghost" @click="resetForm">بازگردانی</AdminButton>
          <AdminButton :loading="saving" @click="saveAll">ذخیره تغییرات</AdminButton>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { settingsService } from '@/services/settings.service'
import { uploadService }   from '@/services/upload.service'
import { useUiStore }      from '@/stores/ui.store'
import { useAdminTheme }   from '@/composables/useAdminTheme'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminTextarea from '@/components/common/AdminTextarea.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const ui = useUiStore()
const { applyTheme } = useAdminTheme()

// Contrast helper for mini navbar preview text
const navbarTextColor = computed(() => {
  const hex = form.theme.navbarBg
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return '#1f2937'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1f2937' : '#f9fafb'
})

const loading = ref(false)
const saving  = ref(false)
const uploading = reactive({ logo: false, favicon: false, ogImage: false })

const fileInputLogo    = ref(null)
const fileInputFavicon = ref(null)
const fileInputOg      = ref(null)

const activeTab = ref('general')

const tabs = [
  { key: 'general', icon: '⚙️', label: 'عمومی' },
  { key: 'theme',   icon: '🎨', label: 'تم سایت' },
  { key: 'seo',     icon: '🔍', label: 'سئو' },
  { key: 'social',  icon: '📱', label: 'شبکه‌های اجتماعی' },
  { key: 'footer',  icon: '📄', label: 'فوتر' },
  { key: 'contact', icon: '📞', label: 'تماس' },
]

const displayModes = [
  { key: 'light',  label: 'روشن',    desc: 'همیشه حالت روشن' },
  { key: 'dark',   label: 'تیره',    desc: 'همیشه حالت تیره' },
  { key: 'system', label: 'خودکار',  desc: 'بر اساس تنظیمات دستگاه' },
]

const colorPresets = [
  { key: 'blue',    label: 'آبی',        color: '#3B82F6' },
  { key: 'indigo',  label: 'نیلی',       color: '#6366F1' },
  { key: 'violet',  label: 'بنفش',       color: '#8B5CF6' },
  { key: 'rose',    label: 'صورتی',      color: '#F43F5E' },
  { key: 'orange',  label: 'نارنجی',     color: '#F97316' },
  { key: 'amber',   label: 'زرد',        color: '#F59E0B' },
  { key: 'emerald', label: 'سبز',        color: '#10B981' },
  { key: 'teal',    label: 'فیروزه‌ای',  color: '#14B8A6' },
  { key: 'cyan',    label: 'آبی روشن',   color: '#06B6D4' },
  { key: 'slate',   label: 'خاکستری',    color: '#64748B' },
  { key: 'custom',  label: 'سفارشی',     color: null },
]

function selectPreset(preset) {
  form.theme.preset = preset.key
  if (preset.color) form.theme.primaryColor = preset.color
}

const activePresetColor = computed(() =>
  form.theme.preset === 'custom'
    ? form.theme.primaryColor
    : (colorPresets.find(p => p.key === form.theme.preset)?.color ?? '#3B82F6')
)

const socialPlatforms = [
  { key: 'instagram', icon: '📷', label: 'اینستاگرام', placeholder: 'https://instagram.com/storein' },
  { key: 'telegram',  icon: '✈️', label: 'تلگرام',     placeholder: 'https://t.me/storein' },
  { key: 'twitter',   icon: '🐦', label: 'توییتر / X',  placeholder: 'https://x.com/storein' },
  { key: 'whatsapp',  icon: '💬', label: 'واتساپ',      placeholder: 'https://wa.me/989...' },
  { key: 'linkedin',  icon: '💼', label: 'لینکدین',     placeholder: 'https://linkedin.com/company/storein' },
  { key: 'youtube',   icon: '▶️', label: 'یوتیوب',     placeholder: 'https://youtube.com/@storein' },
]

const emptyForm = () => ({
  siteName:        '',
  tagline:         '',
  logoUrl:         '',
  faviconUrl:      '',
  description:     '',
  keywords:        '',
  ogImage:         '',
  social: {
    instagram: '',
    telegram:  '',
    twitter:   '',
    whatsapp:  '',
    linkedin:  '',
    youtube:   '',
  },
  footerTagline:   '',
  footerCopyright: '',
  footerLinks:     [],
  phone:           '',
  email:           '',
  address:         '',
  theme: {
    preset:       'blue',
    primaryColor: '#3B82F6',
    defaultMode:  'light',
    navbarBg:     '',
    navbarBorder: '',
    footerBg:     '',
    footerText:   '',
    sidebarBg:    '',
  },
})

const form         = reactive(emptyForm())
const savedSnapshot = ref('')

const dirty = computed(() => JSON.stringify(form) !== savedSnapshot.value)

function snapshot() {
  savedSnapshot.value = JSON.stringify(form)
}

function applyData(data) {
  Object.assign(form, {
    siteName:        data.siteName        ?? '',
    tagline:         data.tagline         ?? '',
    logoUrl:         data.logoUrl         ?? '',
    faviconUrl:      data.faviconUrl      ?? '',
    description:     data.description     ?? '',
    keywords:        data.keywords        ?? '',
    ogImage:         data.ogImage         ?? '',
    social: {
      instagram: data.social?.instagram ?? '',
      telegram:  data.social?.telegram  ?? '',
      twitter:   data.social?.twitter   ?? '',
      whatsapp:  data.social?.whatsapp  ?? '',
      linkedin:  data.social?.linkedin  ?? '',
      youtube:   data.social?.youtube   ?? '',
    },
    footerTagline:   data.footerTagline   ?? '',
    footerCopyright: data.footerCopyright ?? '',
    footerLinks:     (data.footerLinks ?? []).map(l => ({ label: l.label ?? '', url: l.url ?? '' })),
    phone:           data.phone           ?? '',
    email:           data.email           ?? '',
    address:         data.address         ?? '',
    theme: {
      preset:       data.theme?.preset       ?? 'blue',
      primaryColor: data.theme?.primaryColor ?? '#3B82F6',
      defaultMode:  data.theme?.defaultMode  ?? 'light',
      navbarBg:     data.theme?.navbarBg     ?? '',
      navbarBorder: data.theme?.navbarBorder ?? '',
      footerBg:     data.theme?.footerBg     ?? '',
      footerText:   data.theme?.footerText   ?? '',
      sidebarBg:    data.theme?.sidebarBg    ?? '',
    },
  })
  snapshot()
}

function resetForm() {
  if (savedSnapshot.value) {
    applyData(JSON.parse(savedSnapshot.value))
  }
}

// ── Load ──────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    const { data } = await settingsService.get()
    applyData(data)
  } catch {
    ui.addToast('خطا در بارگذاری تنظیمات', 'error')
  } finally {
    loading.value = false
  }
})

// ── Save ──────────────────────────────────────────────────
async function saveAll() {
  saving.value = true
  try {
    const dto = {
      siteName:        form.siteName.trim(),
      tagline:         form.tagline.trim(),
      logoUrl:         form.logoUrl.trim(),
      faviconUrl:      form.faviconUrl.trim(),
      description:     form.description.trim(),
      keywords:        form.keywords.trim(),
      ogImage:         form.ogImage.trim(),
      social: { ...form.social },
      footerTagline:   form.footerTagline.trim(),
      footerCopyright: form.footerCopyright.trim(),
      footerLinks:     form.footerLinks
        .filter(l => l.label.trim() && l.url.trim())
        .map(l => ({ label: l.label.trim(), url: l.url.trim() })),
      phone:   form.phone.trim(),
      email:   form.email.trim(),
      address: form.address.trim(),
      theme: {
        preset:       form.theme.preset,
        primaryColor: form.theme.primaryColor.trim(),
        defaultMode:  form.theme.defaultMode,
        navbarBg:     form.theme.navbarBg.trim(),
        navbarBorder: form.theme.navbarBorder.trim(),
        footerBg:     form.theme.footerBg.trim(),
        footerText:   form.theme.footerText.trim(),
        sidebarBg:    form.theme.sidebarBg.trim(),
      },
    }
    const { data } = await settingsService.update(dto)
    applyData(data)
    applyTheme(data.theme)
    ui.addToast('تنظیمات ذخیره شد ✓', 'success')
  } catch (err) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) msg.forEach(m => ui.addToast(m, 'error'))
    else ui.addToast(msg ?? 'خطا در ذخیره تنظیمات', 'error')
  } finally {
    saving.value = false
  }
}

// ── Footer links ──────────────────────────────────────────
function addFooterLink() {
  form.footerLinks.push({ label: '', url: '' })
}

function removeFooterLink(idx) {
  form.footerLinks.splice(idx, 1)
}

// ── Image upload ──────────────────────────────────────────
const uploadTargets = {
  logo:    { ref: fileInputLogo,    key: 'logoUrl',    flag: 'logo' },
  favicon: { ref: fileInputFavicon, key: 'faviconUrl', flag: 'favicon' },
  ogImage: { ref: fileInputOg,      key: 'ogImage',    flag: 'ogImage' },
}

function triggerUpload(target) {
  uploadTargets[target].ref.value?.click()
}

async function onFileChange(e, target) {
  const file = e.target.files?.[0]
  if (!file) return
  const { key, flag } = uploadTargets[target]
  uploading[flag] = true
  try {
    const { data } = await uploadService.uploadImage(file, 'logos')
    form[key] = data?.original?.url || data?.url || ''
    ui.addToast('تصویر آپلود شد ✓', 'success')
  } catch {
    ui.addToast('خطا در آپلود تصویر', 'error')
  } finally {
    uploading[flag] = false
    e.target.value = ''
  }
}
</script>

<style scoped>
.section-title {
  @apply text-base font-semibold text-text-primary border-b border-border pb-3;
}
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, 1rem); }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
