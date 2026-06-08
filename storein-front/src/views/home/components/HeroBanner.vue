<template>
  <div class="relative w-full overflow-hidden md:rounded-2xl" style="height: 300px;">
    <!-- Slides -->
    <Transition name="banner" mode="out-in">
      <div
        :key="current"
        class="absolute inset-0 flex items-center"
        :style="slideBackground(slides[current])"
      >
        <!-- Image overlay when imageUrl is set -->
        <div v-if="slides[current].imageUrl"
             class="absolute inset-0 bg-cover bg-center"
             :style="{ backgroundImage: `url(${slides[current].imageUrl})` }">
          <div class="absolute inset-0 bg-black/40"></div>
        </div>

        <!-- Text content -->
        <div class="container-main w-full z-10 relative">
          <div class="max-w-xs md:max-w-md">
            <p class="text-sm font-medium mb-2" :style="{ color: slides[current].accent + 'cc' }">
              {{ slides[current].eyebrow }}
            </p>
            <h2 class="text-white font-black text-2xl md:text-3xl leading-tight mb-3">
              {{ slides[current].title }}
            </h2>
            <p class="text-white/75 text-sm md:text-base mb-6 leading-relaxed hidden md:block">
              {{ slides[current].subtitle }}
            </p>
            <RouterLink :to="slides[current].ctaLink || '/'">
              <button
                class="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                :style="{ backgroundColor: slides[current].accent, color: slides[current].bgFrom }"
              >
                {{ slides[current].cta || 'مشاهده محصولات' }}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 rtl:rotate-180">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                </svg>
              </button>
            </RouterLink>
          </div>
        </div>

        <!-- Decorative glasses SVG (only when no image) -->
        <div v-if="!slides[current].imageUrl && slides[current].glasses !== 'none'"
             class="absolute left-0 top-1/2 -translate-y-1/2 opacity-[0.13] pointer-events-none">
          <svg v-if="slides[current].glasses === 'sun'" width="340" height="200" viewBox="0 0 340 200" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="10" y="60" width="140" height="80" rx="40"/>
            <rect x="190" y="60" width="140" height="80" rx="40"/>
            <path d="M150 100 Q170 72 190 100"/>
            <path d="M10 82 Q0 82 0 100"/>
            <path d="M330 82 Q340 82 340 100"/>
            <line x1="30" y1="80" x2="128" y2="80" stroke-width="3" opacity="0.5"/>
            <line x1="30" y1="96" x2="128" y2="96" stroke-width="3" opacity="0.5"/>
            <line x1="210" y1="80" x2="308" y2="80" stroke-width="3" opacity="0.5"/>
            <line x1="210" y1="96" x2="308" y2="96" stroke-width="3" opacity="0.5"/>
          </svg>
          <svg v-else-if="slides[current].glasses === 'rx'" width="340" height="200" viewBox="0 0 340 200" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="100" cy="100" r="76"/>
            <circle cx="240" cy="100" r="76"/>
            <path d="M176 100 Q170 72 164 100" />
            <path d="M24 60 Q6 44 0 54"/>
            <path d="M316 60 Q334 44 340 54"/>
          </svg>
          <svg v-else width="280" height="280" viewBox="0 0 280 280" fill="none" stroke="white" stroke-width="8" stroke-linecap="round">
            <circle cx="140" cy="140" r="110"/>
            <circle cx="140" cy="140" r="60"/>
            <circle cx="140" cy="140" r="20"/>
            <line x1="140" y1="0" x2="140" y2="40" stroke-width="5"/>
            <line x1="140" y1="240" x2="140" y2="280" stroke-width="5"/>
            <line x1="0" y1="140" x2="40" y2="140" stroke-width="5"/>
            <line x1="240" y1="140" x2="280" y2="140" stroke-width="5"/>
          </svg>
        </div>
      </div>
    </Transition>

    <!-- Navigation dots -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
      <button
        v-for="(s, i) in slides"
        :key="s._id || s.id"
        :class="[
          'rounded-full transition-all duration-300',
          current === i ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
        ]"
        @click="goTo(i)"
      />
    </div>

    <!-- Prev / Next arrows (desktop) -->
    <button
      class="hidden md:flex absolute top-1/2 right-4 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 hover:bg-white/35 rounded-full items-center justify-center transition-colors backdrop-blur-sm"
      @click="prev"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
      </svg>
    </button>
    <button
      class="hidden md:flex absolute top-1/2 left-4 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 hover:bg-white/35 rounded-full items-center justify-center transition-colors backdrop-blur-sm"
      @click="next"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { bannerService } from '@/services/banner.service'

const STATIC_SLIDES = [
  {
    id: 1,
    eyebrow:  'کلکسیون تابستان ۱۴۰۴',
    title:    'عینک آفتابی با استایل',
    subtitle: 'بهترین برندهای جهانی با بالاترین کیفیت — ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان',
    cta:      'مشاهده محصولات',
    ctaLink:  '/category/sunglasses',
    bgFrom:   '#0F3D73',
    bgTo:     '#1B4F8A',
    accent:   '#FFD700',
    glasses:  'sun',
    imageUrl: '',
  },
  {
    id: 2,
    eyebrow:  'طبی و استایل با هم',
    title:    'عینک‌های طبی فریم‌لس',
    subtitle: 'سبک، مقاوم و شیک — مناسب هر چهره‌ای با تنوع رنگ بالا',
    cta:      'خرید عینک طبی',
    ctaLink:  '/category/prescription',
    bgFrom:   '#1A3A2A',
    bgTo:     '#2D6A4F',
    accent:   '#B7E4C7',
    glasses:  'rx',
    imageUrl: '',
  },
  {
    id: 3,
    eyebrow:  'راحت و رنگارنگ',
    title:    'لنزهای طبی رنگی',
    subtitle: 'تنوع رنگ، راحتی استفاده، تضمین اصالت کالا — تحویل در کمتر از ۴۸ ساعت',
    cta:      'مشاهده لنزها',
    ctaLink:  '/category/contact-lens',
    bgFrom:   '#2d1b69',
    bgTo:     '#11998e',
    accent:   '#f8f9fa',
    glasses:  'lens',
    imageUrl: '',
  },
]

const slides  = ref([...STATIC_SLIDES])
const current = ref(0)
let autoTimer = null

function slideBackground(slide) {
  if (slide.imageUrl) return {}
  return { background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)` }
}

function next()     { current.value = (current.value + 1) % slides.value.length }
function prev()     { current.value = (current.value - 1 + slides.value.length) % slides.value.length }
function goTo(i)    { current.value = i; resetTimer() }

function resetTimer() {
  clearInterval(autoTimer)
  autoTimer = setInterval(next, 4500)
}

onMounted(async () => {
  autoTimer = setInterval(next, 4500)

  try {
    const { data } = await bannerService.getActive()
    if (Array.isArray(data) && data.length > 0) {
      slides.value = data
      current.value = 0
    }
  } catch {
    // stay with static fallback silently
  }
})

onUnmounted(() => {
  clearInterval(autoTimer)
})
</script>

<style scoped>
.banner-enter-active,
.banner-leave-active { transition: opacity 0.5s ease; }
.banner-enter-from,
.banner-leave-to { opacity: 0; }
</style>
