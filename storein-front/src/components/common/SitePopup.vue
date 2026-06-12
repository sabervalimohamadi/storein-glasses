<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="visible && popup"
        class="fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style="background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);"
        @click.self="close"
      >
        <Transition name="card" appear>
          <div
            v-if="visible && popup"
            class="popup-card relative w-full sm:max-w-md overflow-hidden"
          >

            <!-- Decorative ambient blobs -->
            <div class="blob blob-1" aria-hidden="true"/>
            <div class="blob blob-2" aria-hidden="true"/>

            <!-- ─── Image ──────────────────────────────────── -->
            <div v-if="popup.imageUrl" class="relative overflow-hidden h-56 sm:h-64">
              <img
                :src="popup.imageUrl"
                :alt="popup.title"
                class="w-full h-full object-cover scale-105 img-zoom"
                @error="e => e.target.closest('div').remove()"
              />
              <!-- gradient fade bottom -->
              <div class="absolute inset-0 bg-gradient-to-t from-[var(--popup-bg)] via-transparent to-transparent"/>
              <!-- shimmer sweep on image -->
              <div class="absolute inset-0 img-shimmer pointer-events-none"/>
            </div>

            <!-- ─── Body ───────────────────────────────────── -->
            <div class="relative px-6 pb-7 pt-4 z-10">

              <!-- sparkles row -->
              <div class="flex items-center gap-1.5 mb-3">
                <span class="sparkle sparkle-1">✦</span>
                <span class="sparkle sparkle-2">✦</span>
                <span class="sparkle sparkle-3">✦</span>
              </div>

              <h3
                v-if="popup.title"
                class="text-2xl font-black text-white leading-snug mb-2 title-anim"
                style="text-shadow: 0 2px 16px rgba(0,0,0,0.4);"
              >
                {{ popup.title }}
              </h3>

              <p
                v-if="popup.description"
                class="text-white/70 text-sm leading-relaxed mb-6 desc-anim"
              >
                {{ popup.description }}
              </p>

              <!-- CTA Button -->
              <RouterLink
                v-if="popup.buttonText && popup.buttonLink"
                :to="popup.buttonLink"
                @click="close"
                class="cta-btn btn-anim relative block w-full py-3.5 px-6
                       text-center font-black text-base rounded-2xl
                       overflow-hidden select-none"
              >
                <span class="relative z-10 flex items-center justify-center gap-2">
                  {{ popup.buttonText }}
                  <svg class="w-4 h-4 btn-arrow" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                  </svg>
                </span>
                <!-- shimmer sweep -->
                <span class="btn-shimmer absolute inset-0 pointer-events-none"/>
              </RouterLink>

              <!-- No-thanks -->
              <button
                @click="close"
                class="mt-3 w-full text-center text-xs text-white/40
                       hover:text-white/70 transition-colors py-1"
              >
                نه ممنون، بستن
              </button>

            </div>

            <!-- ─── Close ──────────────────────────────────── -->
            <button
              @click="close"
              class="close-btn absolute top-4 left-4 z-20 w-8 h-8 rounded-full
                     flex items-center justify-center
                     bg-black/30 border border-white/10
                     text-white hover:bg-white/20
                     transition-all duration-200 hover:rotate-90"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { popupService } from '@/services/popup.service'

const popup   = ref(null)
const visible = ref(false)

const STORAGE_PREFIX = 'storein_popup_'
function getStorageKey(id)  { return `${STORAGE_PREFIX}${id}` }

function hasBeenSeen(id, per) {
  if (per === 'always') return false
  const raw = localStorage.getItem(getStorageKey(id))
  if (!raw) return false
  try { const { until } = JSON.parse(raw); return Date.now() < until }
  catch { return false }
}
function markSeen(id, per) {
  if (per === 'always') return
  if (per === 'session') { sessionStorage.setItem(getStorageKey(id), '1'); return }
  const ms = { day: 86400000, week: 604800000 }[per] ?? 86400000
  localStorage.setItem(getStorageKey(id), JSON.stringify({ until: Date.now() + ms }))
}
function hasBeenSeenSession(id) { return !!sessionStorage.getItem(getStorageKey(id)) }

function close() {
  visible.value = false
  if (popup.value) markSeen(popup.value._id, popup.value.showOncePer)
}

onMounted(async () => {
  try {
    const { data } = await popupService.getActive()
    if (!data) return
    popup.value = data
    const id  = data._id
    const per = data.showOncePer ?? 'day'
    if (per === 'session' && hasBeenSeenSession(id)) return
    if (per !== 'session' && hasBeenSeen(id, per))  return
    const delay = Math.max(0, (data.showDelay ?? 2) * 1000)
    setTimeout(() => { visible.value = true }, delay)
  } catch { /* non-critical */ }
})
</script>

<style scoped>
/* ── CSS variables ─────────────────────────────────── */
.popup-card {
  --popup-bg: #0f0f1a;
  background: var(--popup-bg);
  border-radius: 28px 28px 0 0;
  box-shadow:
    0 -8px 40px rgba(0,0,0,0.6),
    0 0 0 1px rgba(255,255,255,0.08),
    inset 0 1px 0 rgba(255,255,255,0.1);
}
@media (min-width: 640px) {
  .popup-card {
    border-radius: 28px;
    box-shadow:
      0 32px 80px rgba(0,0,0,0.7),
      0 0 0 1px rgba(255,255,255,0.08),
      inset 0 1px 0 rgba(255,255,255,0.1);
  }
}

/* ── Backdrop transition ───────────────────────────── */
.backdrop-enter-active { transition: opacity 0.35s ease; }
.backdrop-leave-active { transition: opacity 0.25s ease; }
.backdrop-enter-from,
.backdrop-leave-to     { opacity: 0; }

/* ── Card entrance ─────────────────────────────────── */
.card-enter-active {
  transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.22, 1.2, 0.36, 1);
}
.card-leave-active {
  transition: opacity 0.25s ease, transform 0.2s ease;
}
.card-enter-from {
  opacity: 0;
  transform: translateY(60px) scale(0.92);
}
.card-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}
@media (min-width: 640px) {
  .card-enter-from { transform: scale(0.88) translateY(24px); }
  .card-leave-to   { transform: scale(0.95); }
}

/* ── Ambient blobs ─────────────────────────────────── */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
  animation: blob-drift 6s ease-in-out infinite alternate;
}
.blob-1 {
  width: 200px; height: 200px;
  top: -60px; right: -40px;
  background: radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%);
}
.blob-2 {
  width: 160px; height: 160px;
  bottom: 60px; left: -50px;
  background: radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%);
  animation-delay: -3s;
}
@keyframes blob-drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(12px, -10px) scale(1.08); }
}

/* ── Image zoom on enter ───────────────────────────── */
.img-zoom {
  animation: zoom-in 6s ease forwards;
}
@keyframes zoom-in {
  from { transform: scale(1.08); }
  to   { transform: scale(1);    }
}

/* ── Image shimmer ─────────────────────────────────── */
.img-shimmer {
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255,255,255,0.08) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: shimmer-sweep 3.5s ease-in-out infinite;
}
@keyframes shimmer-sweep {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Sparkles ──────────────────────────────────────── */
.sparkle {
  font-size: 10px;
  animation: sparkle-pulse 2s ease-in-out infinite;
}
.sparkle-1 { color: #a78bfa; animation-delay: 0s; }
.sparkle-2 { color: #f472b6; animation-delay: 0.4s; }
.sparkle-3 { color: #60a5fa; animation-delay: 0.8s; }
@keyframes sparkle-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.4); }
}

/* ── Title + desc animation ────────────────────────── */
.title-anim {
  animation: slide-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s both;
}
.desc-anim {
  animation: slide-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.25s both;
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── CTA Button ────────────────────────────────────── */
.cta-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%);
  color: #fff;
  box-shadow:
    0 4px 24px rgba(139,92,246,0.45),
    0 1px 0 rgba(255,255,255,0.15) inset;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 32px rgba(139,92,246,0.6),
    0 1px 0 rgba(255,255,255,0.15) inset;
}
.cta-btn:active { transform: translateY(0); }

.btn-shimmer {
  background: linear-gradient(
    105deg,
    transparent 35%,
    rgba(255,255,255,0.25) 50%,
    transparent 65%
  );
  background-size: 250% 100%;
  animation: btn-sweep 2.5s ease-in-out infinite;
}
@keyframes btn-sweep {
  0%   { background-position: 250% 0; }
  100% { background-position: -250% 0; }
}

.btn-arrow {
  transition: transform 0.2s ease;
}
.cta-btn:hover .btn-arrow { transform: translateX(-4px); }

.btn-anim {
  animation: slide-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.35s both;
}

/* ── Close button ──────────────────────────────────── */
.close-btn {
  transition: transform 0.2s ease, background 0.2s ease;
}
</style>
