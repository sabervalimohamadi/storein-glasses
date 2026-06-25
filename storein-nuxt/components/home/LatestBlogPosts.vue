<template>
  <section class="blg">

    <!-- Background effects -->
    <div class="blg__dots"  aria-hidden="true"/>
    <div class="blg__glow1" aria-hidden="true"/>
    <div class="blg__glow2" aria-hidden="true"/>

    <!-- ── Header ── -->
    <div class="blg__head">
      <div class="blg__title-wrap">
        <div class="blg__icon-box" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round" class="blg__icon-svg">
            <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
          </svg>
        </div>
        <div>
          <h2 class="blg__title">آخرین مقالات وبلاگ</h2>
          <p class="blg__sub">جدیدترین مطالب آموزشی و خبری</p>
        </div>
      </div>

      <div class="blg__controls">
        <button @click="scroll('right')" :disabled="!canRight" class="blg__nav-btn" aria-label="قبلی">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4">
            <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <button @click="scroll('left')" :disabled="!canLeft" class="blg__nav-btn" aria-label="بعدی">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4">
            <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <NuxtLink to="/blog" class="blg__all-link">
          مشاهده همه
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 rtl:rotate-180">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
        </NuxtLink>
      </div>
    </div>

    <!-- ── Cards track ── -->
    <div ref="trackRef" class="blg__track">

      <!-- Skeletons -->
      <template v-if="loading">
        <div v-for="n in 4" :key="n" class="blg__skeleton">
          <div class="blg__sk-img"/>
          <div class="blg__sk-body">
            <div class="blg__sk-line" style="width:55%;height:10px;"/>
            <div class="blg__sk-line" style="width:90%;height:16px;margin-top:10px;"/>
            <div class="blg__sk-line" style="width:80%;height:12px;margin-top:6px;"/>
            <div class="blg__sk-line" style="width:60%;height:12px;margin-top:4px;"/>
          </div>
        </div>
      </template>

      <!-- Post cards -->
      <template v-else>
        <NuxtLink
          v-for="(post, idx) in posts" :key="post._id"
          :to="`/blog/${post.slug}`"
          class="blg__card"
        >
          <!-- Image area -->
          <div class="blg__img-wrap">
            <img
              v-if="post.featuredImage"
              :src="post.featuredImage"
              :alt="post.title"
              class="blg__img"
              loading="lazy"
            />
            <div v-else class="blg__img-placeholder" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" class="w-12 h-12 opacity-25">
                <path stroke-linecap="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
              </svg>
            </div>
            <!-- Gradient overlay -->
            <div class="blg__img-overlay"/>
            <!-- ویژه badge — only first post -->
            <span v-if="idx === 0" class="blg__badge-hot">ویژه</span>
            <!-- First tag pill on image -->
            <span v-if="post.tags?.[0]" class="blg__img-tag">#{{ post.tags[0] }}</span>
          </div>

          <!-- Content -->
          <div class="blg__content">
            <!-- Author + date row -->
            <div class="blg__meta">
              <div class="blg__avatar" aria-hidden="true">
                {{ authorInitials(post.author) }}
              </div>
              <span class="blg__author-name">{{ authorName(post.author) }}</span>
              <span class="blg__sep" aria-hidden="true">•</span>
              <span class="blg__date font-fanum">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
            </div>

            <!-- Title -->
            <h3 class="blg__post-title">{{ post.title }}</h3>

            <!-- Excerpt -->
            <p v-if="post.excerpt" class="blg__excerpt">{{ post.excerpt }}</p>

            <!-- Footer: tags + views -->
            <div class="blg__footer">
              <div class="blg__tags">
                <span v-for="tag in post.tags?.slice(0, 2)" :key="tag" class="blg__tag">#{{ tag }}</span>
              </div>
              <div class="blg__stats">
                <span v-if="post.viewCount" class="blg__stat font-fanum">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" d="M2.036 12.322a1 1 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"/>
                    <path stroke-linecap="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  </svg>
                  {{ formatCount(post.viewCount) }}
                </span>
                <span class="blg__stat font-fanum">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                  </svg>
                  {{ readTime(post.excerpt) }} دقیقه
                </span>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Empty state -->
        <div v-if="!posts.length" class="blg__empty">هنوز مقاله‌ای منتشر نشده است</div>
      </template>

    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { blogService } from '~/services/blog.service'

const posts    = ref([])
const loading  = ref(true)
const trackRef = ref(null)
const canLeft  = ref(false)
const canRight = ref(false)

onMounted(async () => {
  try {
    const { data } = await blogService.getAll({ sortBy: 'newest', limit: 8 })
    posts.value = data?.posts ?? data?.items ?? data ?? []
  } catch {
    posts.value = []
  } finally {
    loading.value = false
    nextTick(initScroll)
  }
})

function initScroll() {
  const el = trackRef.value
  if (!el) return
  const update = () => {
    // RTL: scrollLeft is 0 at the right end, negative toward left end
    const sl = Math.abs(el.scrollLeft)
    canRight.value = sl > 8
    canLeft.value  = sl < el.scrollWidth - el.clientWidth - 8
  }
  update()
  el.addEventListener('scroll', update, { passive: true })
}

function scroll(dir) {
  const el = trackRef.value
  if (!el) return
  // RTL: scrolling "right" (→ next) moves scrollLeft negative
  el.scrollBy({ left: dir === 'right' ? -300 : 300, behavior: 'smooth' })
}

function authorName(author) {
  if (!author) return 'تیم تحریریه'
  if (author.firstName || author.lastName) return `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim()
  return 'تیم تحریریه'
}

function authorInitials(author) {
  if (!author?.firstName) return '✍'
  return author.firstName[0] + (author.lastName?.[0] ?? '')
}

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fa-IR', { month: 'long', day: 'numeric' }).format(new Date(iso))
}

function formatCount(n = 0) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

function readTime(excerpt = '') {
  const words = excerpt?.trim().split(/\s+/).length || 0
  return Math.max(1, Math.ceil(words / 60))
}
</script>

<style scoped>
/* ── Root ───────────────────────────────────────────── */
.blg {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #080c18 0%, #0c1128 55%, #060a14 100%);
  border: 1px solid rgba(99,102,241,0.18);
}

/* Dot grid */
.blg__dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px);
  background-size: 22px 22px;
  pointer-events: none;
}

/* Ambient glow blobs */
.blg__glow1 {
  position: absolute;
  top: -100px; right: 10%;
  width: 380px; height: 380px;
  background: radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%);
  pointer-events: none;
}
.blg__glow2 {
  position: absolute;
  bottom: -80px; left: 15%;
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 65%);
  pointer-events: none;
}

/* ── Header ─────────────────────────────────────────── */
.blg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1.25rem 1.375rem 0.875rem;
  position: relative;
  z-index: 1;
}

.blg__title-wrap {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.blg__icon-box {
  width: 44px; height: 44px;
  border-radius: 13px;
  background: rgba(99,102,241,0.15);
  border: 1px solid rgba(99,102,241,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 14px rgba(99,102,241,0.25);
}

.blg__icon-svg {
  width: 22px; height: 22px;
  color: #818cf8;
  filter: drop-shadow(0 0 5px rgba(99,102,241,0.8));
}

.blg__title {
  font-size: 1.25rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
}

.blg__sub {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.38);
  margin: 3px 0 0;
}

.blg__controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.blg__nav-btn {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.blg__nav-btn:hover:not(:disabled) {
  background: rgba(99,102,241,0.25);
  color: #818cf8;
  border-color: rgba(99,102,241,0.4);
}
.blg__nav-btn:disabled { opacity: 0.25; cursor: default; }

.blg__all-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(129,140,248,0.75);
  text-decoration: none;
  transition: color 0.2s, gap 0.2s;
  white-space: nowrap;
  margin-right: 0.25rem;
}
.blg__all-link:hover { color: #818cf8; gap: 8px; }

/* ── Scrollable track ───────────────────────────────── */
.blg__track {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 0.25rem 1.375rem 1.375rem;
  scrollbar-width: none;
  position: relative;
  z-index: 1;
}
.blg__track::-webkit-scrollbar { display: none; }

/* ── Skeleton ───────────────────────────────────────── */
.blg__skeleton {
  min-width: 270px;
  max-width: 270px;
  flex-shrink: 0;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  animation: blg-pulse 1.6s ease-in-out infinite;
}
.blg__sk-img  { height: 168px; background: rgba(255,255,255,0.06); }
.blg__sk-body { padding: 1rem; }
.blg__sk-line {
  height: 12px;
  border-radius: 6px;
  background: rgba(255,255,255,0.07);
  margin-bottom: 4px;
}
@keyframes blg-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* ── Card ───────────────────────────────────────────── */
.blg__card {
  min-width: 270px;
  max-width: 270px;
  flex-shrink: 0;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(99,102,241,0.15);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.blg__card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.35);
  border-color: rgba(99,102,241,0.45);
}

/* ── Image area ─────────────────────────────────────── */
.blg__img-wrap {
  position: relative;
  height: 168px;
  overflow: hidden;
  background: rgba(255,255,255,0.05);
  flex-shrink: 0;
}

.blg__img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.blg__card:hover .blg__img { transform: scale(1.06); }

.blg__img-placeholder {
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(167,139,250,0.06));
  color: rgba(255,255,255,0.3);
}

.blg__img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(8,12,24,0.85) 0%, rgba(8,12,24,0.1) 55%, transparent 100%);
  pointer-events: none;
}

/* Badges on image */
.blg__badge-hot {
  position: absolute;
  top: 10px; left: 10px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 800;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  box-shadow: 0 2px 8px rgba(245,158,11,0.5);
  letter-spacing: 0.02em;
}

.blg__img-tag {
  position: absolute;
  top: 10px; right: 10px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 600;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.85);
  border: 1px solid rgba(255,255,255,0.12);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Content ────────────────────────────────────────── */
.blg__content {
  padding: 0.875rem 1rem 0.875rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.5rem;
}

/* Meta row */
.blg__meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: nowrap;
  overflow: hidden;
}

.blg__avatar {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(167,139,250,0.4));
  border: 1px solid rgba(99,102,241,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  font-weight: 700;
  color: #c7d2fe;
  flex-shrink: 0;
}

.blg__author-name {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255,255,255,0.65);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.blg__sep {
  color: rgba(255,255,255,0.2);
  font-size: 0.7rem;
  flex-shrink: 0;
}

.blg__date {
  font-size: 0.68rem;
  color: rgba(255,255,255,0.35);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Title */
.blg__post-title {
  font-size: 0.93rem;
  font-weight: 800;
  color: #f1f5f9;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  transition: color 0.2s;
}
.blg__card:hover .blg__post-title { color: #a5b4fc; }

/* Excerpt */
.blg__excerpt {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.38);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  flex: 1;
}

/* ── Footer ─────────────────────────────────────────── */
.blg__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255,255,255,0.07);
  margin-top: auto;
}

.blg__tags {
  display: flex;
  gap: 0.3rem;
  flex-wrap: nowrap;
  overflow: hidden;
  min-width: 0;
}

.blg__tag {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 20px;
  background: rgba(99,102,241,0.15);
  border: 1px solid rgba(99,102,241,0.25);
  color: #a5b4fc;
  white-space: nowrap;
  transition: background 0.2s;
}
.blg__card:hover .blg__tag {
  background: rgba(99,102,241,0.25);
}

.blg__stats {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.blg__stat {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  color: rgba(255,255,255,0.3);
  white-space: nowrap;
}
.blg__stat svg { flex-shrink: 0; }

/* ── Empty ──────────────────────────────────────────── */
.blg__empty {
  width: 100%;
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255,255,255,0.3);
  font-size: 0.875rem;
}
</style>
