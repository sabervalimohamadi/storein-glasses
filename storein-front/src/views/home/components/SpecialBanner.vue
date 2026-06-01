<template>
  <section class="py-2">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

      <!-- Banner 1: عینک آفتابی -->
      <RouterLink
        to="/category/sunglasses"
        class="relative rounded-2xl overflow-hidden flex items-center justify-between px-8 py-8 cursor-pointer group hover:shadow-lg transition-shadow duration-300"
        style="background: linear-gradient(135deg, #0F3D73 0%, #1B4F8A 100%); min-height: 168px;"
      >
        <div class="text-white z-10 relative">
          <p class="text-sm opacity-75 mb-1">کلکسیون تابستان ۱۴۰۴</p>
          <h3 class="text-2xl font-black mb-4 leading-tight">عینک آفتابی</h3>
          <span class="inline-flex items-center gap-1.5 text-xs bg-white/20 rounded-full px-4 py-1.5 group-hover:bg-white/30 transition-colors">
            مشاهده محصولات
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 rtl:rotate-180">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
          </span>
        </div>

        <!-- Decorative sunglasses SVG -->
        <div class="absolute left-4 top-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none">
          <svg width="180" height="90" viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="26" width="64" height="40" rx="20"/>
            <rect x="110" y="26" width="64" height="40" rx="20"/>
            <path d="M70 46 Q90 32 110 46"/>
            <path d="M6 38 Q0 38 0 50"/>
            <path d="M174 38 Q180 38 180 50"/>
            <!-- Tint lines inside lenses -->
            <path d="M18 36 L58 36" stroke-width="2" opacity="0.6"/>
            <path d="M18 44 L58 44" stroke-width="2" opacity="0.6"/>
            <path d="M122 36 L162 36" stroke-width="2" opacity="0.6"/>
            <path d="M122 44 L162 44" stroke-width="2" opacity="0.6"/>
          </svg>
        </div>
      </RouterLink>

      <!-- Banner 2: عینک طبی -->
      <RouterLink
        to="/category/prescription"
        class="relative rounded-2xl overflow-hidden flex items-center justify-between px-8 py-8 cursor-pointer group hover:shadow-lg transition-shadow duration-300"
        style="background: linear-gradient(135deg, #1A3A2A 0%, #2D6A4F 100%); min-height: 168px;"
      >
        <div class="text-white z-10 relative">
          <p class="text-sm opacity-75 mb-1">طبی و استایل</p>
          <h3 class="text-2xl font-black mb-4 leading-tight">عینک طبی</h3>
          <span class="inline-flex items-center gap-1.5 text-xs bg-white/20 rounded-full px-4 py-1.5 group-hover:bg-white/30 transition-colors">
            مشاهده محصولات
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 rtl:rotate-180">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
          </span>
        </div>

        <!-- Decorative prescription glasses SVG -->
        <div class="absolute left-4 top-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none">
          <svg width="180" height="90" viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="48" cy="46" r="34"/>
            <circle cx="132" cy="46" r="34"/>
            <path d="M82 46 Q90 34 98 46"/>
            <path d="M14 24 Q4 16 0 22"/>
            <path d="M166 24 Q176 16 180 22"/>
          </svg>
        </div>
      </RouterLink>

    </div>
  </section>
</template>

<script setup>
</script>
