<template>
  <div class="flex flex-col gap-3">

    <!-- SKELETON -->
    <template v-if="loading">
      <BaseSkeleton height="420px" class="rounded-2xl w-full" />
      <div class="flex gap-2">
        <BaseSkeleton v-for="i in 4" :key="i" height="72px" width="72px" class="rounded-xl flex-shrink-0" />
      </div>
    </template>

    <!-- REAL GALLERY -->
    <template v-else>

      <!-- Main image -->
      <div
        class="relative rounded-2xl overflow-hidden border border-surface-border group cursor-zoom-in"
        style="background-color: var(--color-card); aspect-ratio: 1 / 1;"
        ref="mainContainer"
        @click="openLightbox"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <Transition name="gallery-fade" mode="out-in">
          <img
            :key="activeIndex"
            :src="activeImage.url || activeImage.thumbnail"
            :alt="name"
            class="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            @error="onImgError"
          />
        </Transition>

        <!-- Desktop nav arrows -->
        <template v-if="normalizedImages.length > 1">
          <button
            @click.stop="prev"
            class="hidden md:flex absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 bg-white/90 shadow-card rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
          >
            <svg class="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <button
            @click.stop="next"
            class="hidden md:flex absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 bg-white/90 shadow-card rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
          >
            <svg class="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        </template>

        <!-- Mobile counter badge -->
        <div
          v-if="normalizedImages.length > 1"
          class="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-fanum"
        >
          {{ activeIndex + 1 }}/{{ normalizedImages.length }}
        </div>
      </div>

      <!-- Desktop thumbnails -->
      <div v-if="normalizedImages.length > 1" class="hidden md:flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          v-for="(img, idx) in normalizedImages"
          :key="idx"
          @click="activeIndex = idx"
          :class="[
            'flex-shrink-0 w-[72px] h-[72px] rounded-xl border-2 overflow-hidden transition-all duration-150',
            activeIndex === idx
              ? 'border-brand shadow-sm scale-105'
              : 'border-surface-border hover:border-brand/50',
          ]"
        >
          <img :src="img.thumbnail || img.url" :alt="`تصویر ${idx + 1}`" class="w-full h-full object-contain p-1" />
        </button>
      </div>

      <!-- Mobile dot indicators -->
      <div v-if="normalizedImages.length > 1" class="md:hidden flex justify-center gap-1.5 py-1">
        <button
          v-for="(_, idx) in normalizedImages"
          :key="idx"
          @click="activeIndex = idx"
          :class="[
            'rounded-full transition-all duration-200',
            activeIndex === idx ? 'w-5 h-1.5 bg-brand' : 'w-1.5 h-1.5 bg-gray-300',
          ]"
        />
      </div>

    </template>
  </div>

  <!-- Lightbox -->
  <Teleport to="body">
    <Transition name="lb-fade">
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-[999] flex items-center justify-center bg-black/90"
        @click.self="closeLightbox"
        @keydown.esc="closeLightbox"
        tabindex="0"
        ref="lightboxEl"
      >
        <!-- Close button -->
        <button
          @click="closeLightbox"
          class="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Prev -->
        <button
          v-if="normalizedImages.length > 1"
          @click="prev"
          class="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

        <!-- Image -->
        <img
          :src="activeImage.url || activeImage.thumbnail"
          :alt="name"
          class="max-w-[90vw] max-h-[90vh] object-contain select-none"
          @error="onImgError"
        />

        <!-- Next -->
        <button
          v-if="normalizedImages.length > 1"
          @click="next"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <!-- Counter -->
        <div
          v-if="normalizedImages.length > 1"
          class="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full font-fanum"
        >
          {{ activeIndex + 1 }} / {{ normalizedImages.length }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import { PRODUCT_PLACEHOLDER } from '@/utils/constants'

const props = defineProps({
  images:  { type: Array,   default: () => [] },
  name:    { type: String,  default: '' },
  loading: { type: Boolean, default: false },
})

const activeIndex   = ref(0)
const mainContainer = ref(null)
const lightboxOpen  = ref(false)
const lightboxEl    = ref(null)

function normalizeImg(img) {
  if (!img) return { url: PRODUCT_PLACEHOLDER, thumbnail: PRODUCT_PLACEHOLDER }
  if (typeof img === 'string') return { url: img, thumbnail: img }
  return img
}

const normalizedImages = computed(() => props.images.map(normalizeImg))

const activeImage = computed(() =>
  normalizedImages.value[activeIndex.value] || { url: PRODUCT_PLACEHOLDER }
)

function next() {
  activeIndex.value = (activeIndex.value + 1) % normalizedImages.value.length
}
function prev() {
  activeIndex.value = (activeIndex.value - 1 + normalizedImages.value.length) % normalizedImages.value.length
}

async function openLightbox() {
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
  await nextTick()
  lightboxEl.value?.focus()
}
function closeLightbox() {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

let touchStartX = 0
function onTouchStart(e) { touchStartX = e.touches[0].clientX }
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) < 50) return
  if (dx > 0) prev()
  else        next()
}

function onImgError(e) { e.target.src = PRODUCT_PLACEHOLDER }

defineExpose({ setImage: (idx) => { activeIndex.value = idx } })
</script>

<style scoped>
.gallery-fade-enter-active,
.gallery-fade-leave-active {
  transition: opacity 0.25s ease;
}
.gallery-fade-enter-from,
.gallery-fade-leave-to {
  opacity: 0;
}

.lb-fade-enter-active,
.lb-fade-leave-active {
  transition: opacity 0.2s ease;
}
.lb-fade-enter-from,
.lb-fade-leave-to {
  opacity: 0;
}
</style>
