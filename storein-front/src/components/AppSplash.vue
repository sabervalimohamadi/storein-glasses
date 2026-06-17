<template>
  <Transition name="splash" @after-leave="onAfterLeave">
    <div v-if="!ready" class="splash" data-testid="splash-root">
      <div class="splash__inner">

        <!-- ── Glasses SVG ── -->
        <div class="splash__icon" aria-hidden="true">
          <svg viewBox="-28 0 356 90" xmlns="http://www.w3.org/2000/svg" overflow="visible">
            <defs>
              <clipPath id="sp-clip-l">
                <rect x="6" y="9" width="113" height="72" rx="17"/>
              </clipPath>
              <clipPath id="sp-clip-r">
                <rect x="181" y="9" width="113" height="72" rx="17"/>
              </clipPath>
            </defs>

            <!-- Lens fills (appear after frames draw) -->
            <rect class="sp-fill" x="6"   y="9" width="113" height="72" rx="17"/>
            <rect class="sp-fill sp-fill--r" x="181" y="9" width="113" height="72" rx="17"/>

            <!-- Highlight reflections inside lenses -->
            <ellipse class="sp-shine"     cx="36"  cy="30" rx="22" ry="9"
                     clip-path="url(#sp-clip-l)"/>
            <ellipse class="sp-shine sp-shine--r" cx="211" cy="30" rx="22" ry="9"
                     clip-path="url(#sp-clip-r)"/>

            <!-- Left temple — draws first -->
            <line class="sp-frame sp-temple-l"
                  x1="8"  y1="36" x2="-24" y2="24" stroke-linecap="round"/>

            <!-- Left lens frame — draws second -->
            <rect class="sp-frame sp-lens-l"
                  x="6" y="9" width="113" height="72" rx="17"/>

            <!-- Bridge — draws third -->
            <path class="sp-frame sp-bridge"
                  d="M 119 45 Q 132 26 150 26 Q 168 26 181 45"
                  fill="none" stroke-linecap="round"/>

            <!-- Right lens frame — draws fourth -->
            <rect class="sp-frame sp-lens-r"
                  x="181" y="9" width="113" height="72" rx="17"/>

            <!-- Right temple — draws last -->
            <line class="sp-frame sp-temple-r"
                  x1="292" y1="36" x2="324" y2="24" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- ── Brand ── -->
        <h1 class="splash__brand">استورین</h1>
        <p class="splash__tagline">فروشگاه تخصصی عینک</p>

        <!-- ── Loading dots ── -->
        <div class="splash__dots" role="status" aria-label="در حال بارگذاری">
          <span class="dot"/>
          <span class="dot"/>
          <span class="dot"/>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { logger } from '@/utils/logger'

const CTX = 'AppSplash'

const props = defineProps({
  ready: { type: Boolean, default: false },
})

const emit = defineEmits(['hidden'])

watch(
  () => props.ready,
  (r) => {
    if (r) logger.info('splash: app ready — fading out splash screen', {}, CTX)
  },
)

function onAfterLeave() {
  logger.debug('splash: leave animation complete — splash removed from DOM', {}, CTX)
  emit('hidden')
}

onMounted(() => {
  logger.debug('splash: glasses animation started', {}, CTX)
})

defineExpose({ onAfterLeave })
</script>

<style scoped>
/* ── Root overlay ── */
.splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d1b33;
}

.splash__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
}

/* ── Glasses SVG wrapper ── */
.splash__icon {
  width: 240px;
  max-width: 72vw;
}

.splash__icon svg {
  width: 100%;
  height: auto;
}

/* ── Frame strokes ── */
.sp-frame {
  fill: none;
  stroke: #4a9eff;
  stroke-width: 3.8;
}

/* Left lens: draws in 0.9 s, starts at 0.15 s */
.sp-lens-l {
  stroke-dasharray: 342;
  stroke-dashoffset: 342;
  animation: sp-draw 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.15s;
}

/* Bridge: draws in 0.4 s, starts when left lens is ~60% done */
.sp-bridge {
  stroke-dasharray: 90;
  stroke-dashoffset: 90;
  animation: sp-draw 0.4s ease-out forwards 0.65s;
}

/* Right lens: draws in 0.9 s, starts just after bridge */
.sp-lens-r {
  stroke-dasharray: 342;
  stroke-dashoffset: 342;
  animation: sp-draw 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.72s;
}

/* Temples: quick lines before / after their respective lens */
.sp-temple-l {
  stroke-dasharray: 38;
  stroke-dashoffset: 38;
  animation: sp-draw 0.25s ease-out forwards 0.05s;
}

.sp-temple-r {
  stroke-dasharray: 38;
  stroke-dashoffset: 38;
  animation: sp-draw 0.25s ease-out forwards 1.1s;
}

@keyframes sp-draw {
  to { stroke-dashoffset: 0; }
}

/* ── Lens fills ── */
.sp-fill {
  fill: rgba(74, 158, 255, 0.1);
  opacity: 0;
  animation: sp-fade-in 0.45s ease-out forwards 0.95s;
}

.sp-fill--r {
  animation-delay: 1.5s;
}

@keyframes sp-fade-in {
  to { opacity: 1; }
}

/* ── Lens highlight reflections ── */
.sp-shine {
  fill: rgba(255, 255, 255, 0.28);
  opacity: 0;
  transform-origin: center;
  animation: sp-shine 3.2s ease-in-out infinite 1.4s;
}

.sp-shine--r {
  animation-delay: 1.9s;
}

@keyframes sp-shine {
  0%   { opacity: 0;    transform: translate(-10px, -4px) rotate(-10deg); }
  20%  { opacity: 0.85; }
  55%  { opacity: 0.3;  transform: translate(10px,  4px) rotate(-10deg); }
  100% { opacity: 0;    transform: translate(-10px, -4px) rotate(-10deg); }
}

/* ── Brand text ── */
.splash__brand {
  margin: 0;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  opacity: 0;
  transform: translateY(12px);
  animation: sp-text-in 0.5s ease-out forwards 1.0s;
}

.splash__tagline {
  margin: 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.875rem;
  letter-spacing: 0.02em;
  opacity: 0;
  transform: translateY(8px);
  animation: sp-text-in 0.5s ease-out forwards 1.18s;
}

@keyframes sp-text-in {
  to { opacity: 1; transform: translateY(0); }
}

/* ── Loading dots ── */
.splash__dots {
  display: flex;
  gap: 7px;
  margin-top: 0.4rem;
}

.dot {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4a9eff;
  opacity: 0;
  animation: sp-dot 1.3s ease-in-out infinite;
}

.dot:nth-child(1) { animation-delay: 1.4s; }
.dot:nth-child(2) { animation-delay: 1.58s; }
.dot:nth-child(3) { animation-delay: 1.76s; }

@keyframes sp-dot {
  0%, 70%, 100% { opacity: 0.2; transform: scale(0.75); }
  35%            { opacity: 1;   transform: scale(1.2); }
}

/* ── Fade-out transition ── */
.splash-leave-active {
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.splash-leave-to {
  opacity: 0;
  transform: scale(1.04);
}
</style>
