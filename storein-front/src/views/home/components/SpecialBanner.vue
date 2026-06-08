<template>
  <section class="py-2">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RouterLink
        v-for="banner in displayed"
        :key="banner._id || banner.id"
        :to="banner.ctaLink || '/'"
        class="relative rounded-2xl overflow-hidden flex items-center justify-between px-8 py-8 cursor-pointer group hover:shadow-lg transition-shadow duration-300"
        :style="cardBackground(banner)"
        style="min-height: 168px;"
      >
        <!-- Text -->
        <div class="text-white z-10 relative">
          <p class="text-sm opacity-75 mb-1">{{ banner.eyebrow }}</p>
          <h3 class="text-2xl font-black mb-4 leading-tight">{{ banner.title }}</h3>
          <span class="inline-flex items-center gap-1.5 text-xs bg-white/20 rounded-full px-4 py-1.5 group-hover:bg-white/30 transition-colors">
            {{ banner.cta || 'مشاهده محصولات' }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 rtl:rotate-180">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
          </span>
        </div>

        <!-- Image overlay when imageUrl is set -->
        <div v-if="banner.imageUrl"
             class="absolute inset-0 bg-cover bg-center pointer-events-none"
             :style="{ backgroundImage: `url(${banner.imageUrl})` }">
          <div class="absolute inset-0 bg-black/40"></div>
        </div>

        <!-- Decorative SVG (only without image) -->
        <div v-else-if="banner.glasses !== 'none'"
             class="absolute left-4 top-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none">
          <svg v-if="banner.glasses === 'sun'" width="180" height="90" viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="26" width="64" height="40" rx="20"/>
            <rect x="110" y="26" width="64" height="40" rx="20"/>
            <path d="M70 46 Q90 32 110 46"/>
            <path d="M6 38 Q0 38 0 50"/>
            <path d="M174 38 Q180 38 180 50"/>
            <path d="M18 36 L58 36" stroke-width="2" opacity="0.6"/>
            <path d="M18 44 L58 44" stroke-width="2" opacity="0.6"/>
            <path d="M122 36 L162 36" stroke-width="2" opacity="0.6"/>
            <path d="M122 44 L162 44" stroke-width="2" opacity="0.6"/>
          </svg>
          <svg v-else-if="banner.glasses === 'rx'" width="180" height="90" viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="48" cy="46" r="34"/>
            <circle cx="132" cy="46" r="34"/>
            <path d="M82 46 Q90 34 98 46"/>
            <path d="M14 24 Q4 16 0 22"/>
            <path d="M166 24 Q176 16 180 22"/>
          </svg>
          <svg v-else width="120" height="120" viewBox="0 0 280 280" fill="none" stroke="white" stroke-width="8" stroke-linecap="round">
            <circle cx="140" cy="140" r="110"/>
            <circle cx="140" cy="140" r="60"/>
            <circle cx="140" cy="140" r="20"/>
          </svg>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bannerService } from '@/services/banner.service'

const STATIC_BANNERS = [
  {
    id:       1,
    eyebrow:  'کلکسیون تابستان ۱۴۰۴',
    title:    'عینک آفتابی',
    cta:      'مشاهده محصولات',
    ctaLink:  '/category/sunglasses',
    bgFrom:   '#0F3D73',
    bgTo:     '#1B4F8A',
    glasses:  'sun',
    imageUrl: '',
  },
  {
    id:       2,
    eyebrow:  'طبی و استایل',
    title:    'عینک طبی',
    cta:      'مشاهده محصولات',
    ctaLink:  '/category/prescription',
    bgFrom:   '#1A3A2A',
    bgTo:     '#2D6A4F',
    glasses:  'rx',
    imageUrl: '',
  },
]

const displayed = ref([...STATIC_BANNERS])

function cardBackground(banner) {
  if (banner.imageUrl) return {}
  return { background: `linear-gradient(135deg, ${banner.bgFrom} 0%, ${banner.bgTo} 100%)` }
}

onMounted(async () => {
  try {
    const { data } = await bannerService.getActivePromo()
    if (Array.isArray(data) && data.length > 0) {
      displayed.value = data
    }
  } catch {
    // silently keep static fallback
  }
})
</script>
