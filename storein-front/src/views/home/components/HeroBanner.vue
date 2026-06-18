<template>
  <div class="hero">

    <Transition name="hero">
      <div :key="current" class="hero__slide" :style="slideStyle(slides[current])">

        <!-- Background image with ken-burns -->
        <div v-if="slides[current].imageUrl"
             class="hero__img"
             :style="{ backgroundImage: `url(${slides[current].imageUrl})` }" />

        <!-- Gradient veil for text readability -->
        <div class="hero__veil" />

        <!-- Dot-mesh texture overlay -->
        <div class="hero__mesh" aria-hidden="true" />

        <!-- Decorative glasses SVG when no image -->
        <div v-if="!slides[current].imageUrl && slides[current].glasses !== 'none'"
             class="hero__deco" aria-hidden="true">
          <svg v-if="slides[current].glasses === 'sun'" width="420" height="260"
               viewBox="0 0 340 200" fill="none" stroke="white" stroke-width="6"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="10" y="60" width="140" height="80" rx="40"/>
            <rect x="190" y="60" width="140" height="80" rx="40"/>
            <path d="M150 100 Q170 72 190 100"/>
            <path d="M10 82 Q0 82 0 100"/>
            <path d="M330 82 Q340 82 340 100"/>
          </svg>
          <svg v-else-if="slides[current].glasses === 'rx'" width="420" height="260"
               viewBox="0 0 340 200" fill="none" stroke="white" stroke-width="6"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="100" cy="100" r="76"/>
            <circle cx="240" cy="100" r="76"/>
            <path d="M176 100 Q170 72 164 100"/>
            <path d="M24 60 Q6 44 0 54"/>
            <path d="M316 60 Q334 44 340 54"/>
          </svg>
          <svg v-else width="280" height="280" viewBox="0 0 280 280"
               fill="none" stroke="white" stroke-width="6" stroke-linecap="round">
            <circle cx="140" cy="140" r="110"/>
            <circle cx="140" cy="140" r="60"/>
            <circle cx="140" cy="140" r="20"/>
            <line x1="140" y1="0" x2="140" y2="40" stroke-width="4"/>
            <line x1="140" y1="240" x2="140" y2="280" stroke-width="4"/>
            <line x1="0" y1="140" x2="40" y2="140" stroke-width="4"/>
            <line x1="240" y1="140" x2="280" y2="140" stroke-width="4"/>
          </svg>
        </div>

        <!-- Text content -->
        <div class="container-main hero__body">
          <div class="hero__copy">
            <span class="hero__eyebrow">{{ slides[current].eyebrow }}</span>
            <h2 class="hero__title">{{ slides[current].title }}</h2>
            <p class="hero__sub">{{ slides[current].subtitle }}</p>
            <RouterLink :to="slides[current].ctaLink || '/'">
              <button
                class="hero__btn"
                :style="{ backgroundColor: slides[current].accent, color: slides[current].bgFrom }"
              >
                {{ slides[current].cta || 'مشاهده محصولات' }}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     stroke-width="2.5" stroke="currentColor" class="hero__btn-ico">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                </svg>
              </button>
            </RouterLink>
          </div>
        </div>

        <!-- Slide progress bar -->
        <div class="hero__prog">
          <div :key="`prog-${current}`" class="hero__prog-fill"
               :style="{ backgroundColor: slides[current].accent }" />
        </div>

      </div>
    </Transition>

    <!-- Slide indicators -->
    <div class="hero__dots">
      <button
        v-for="(s, i) in slides"
        :key="s._id || s.id"
        :class="['hero__dot', current === i && 'hero__dot--on']"
        @click="goTo(i)"
      />
    </div>

    <!-- Prev / Next arrows -->
    <button class="hero__arr hero__arr--r" @click="prev" aria-label="قبلی">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
           stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
      </svg>
    </button>
    <button class="hero__arr hero__arr--l" @click="next" aria-label="بعدی">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
           stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
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

function slideStyle(slide) {
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

onUnmounted(() => clearInterval(autoTimer))
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────── */
.hero {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
  border-radius: 0;
  margin-top: 0.75rem;
}

@media (min-width: 768px) {
  .hero {
    height: 420px;
    border-radius: 20px;
  }
}

/* ── Slide ─────────────────────────────────────────── */
.hero__slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
}

/* Background image with Ken Burns */
.hero__img {
  position: absolute;
  inset: -4%;
  background-size: cover;
  background-position: center;
  animation: kb 14s ease-in-out infinite alternate;
}
@keyframes kb {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.07) translate(-1%, -1%); }
}

/* Gradient overlay for readability */
.hero__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to left, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.7) 100%);
}

/* Dot mesh texture */
.hero__mesh {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}

/* Decorative SVG */
.hero__deco {
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.09;
  pointer-events: none;
}

/* ── Body ────────────────────────────────────────────── */
.hero__body {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero__copy {
  max-width: 440px;
  animation: copy-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes copy-in {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Eyebrow pill */
.hero__eyebrow {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.88);
  background: rgba(255,255,255,0.14);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.22);
  padding: 4px 12px;
  border-radius: 99px;
  margin-bottom: 14px;
}

/* Title */
.hero__title {
  font-size: 1.625rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.3;
  margin: 0 0 12px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.35);
}
@media (min-width: 768px) {
  .hero__title { font-size: 2.375rem; margin-bottom: 14px; }
}

/* Subtitle */
.hero__sub {
  display: none;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.68);
  line-height: 1.7;
  margin: 0 0 26px;
}
@media (min-width: 768px) {
  .hero__sub { display: block; }
}

/* CTA button */
.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 11px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 24px rgba(0,0,0,0.28);
  margin-top: 14px;
}
.hero__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.38);
}
.hero__btn:active { transform: scale(0.97); }
.hero__btn-ico { width: 16px; height: 16px; }

/* ── Progress bar ────────────────────────────────────── */
.hero__prog {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.12);
  z-index: 5;
}
.hero__prog-fill {
  height: 100%;
  width: 0;
  animation: prog 4.5s linear forwards;
}
@keyframes prog {
  to { width: 100%; }
}

/* ── Dots ──────────────────────────────────────────── */
.hero__dots {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 10;
}
.hero__dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: rgba(255,255,255,0.38);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}
.hero__dot--on {
  width: 22px;
  background: rgba(255,255,255,0.9);
}

/* ── Arrows ────────────────────────────────────────── */
.hero__arr {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.14);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.22);
  color: white;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
@media (min-width: 768px) {
  .hero__arr { display: flex; }
}
.hero__arr:hover { background: rgba(255,255,255,0.26); }
.hero__arr--r { right: 16px; }
.hero__arr--l { left: 16px; }

/* ── Transition ─────────────────────────────────────── */
.hero-enter-active { transition: opacity 0.55s ease; }
.hero-leave-active { transition: opacity 0.35s ease; }
.hero-enter-from, .hero-leave-to { opacity: 0; }
</style>
