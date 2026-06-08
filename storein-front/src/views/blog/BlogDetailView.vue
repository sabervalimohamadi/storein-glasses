<template>
  <div class="min-h-screen bg-[var(--color-bg)]">

    <!-- Loading skeleton -->
    <template v-if="store.loading">
      <div class="animate-pulse">
        <div class="h-64 bg-gray-300 dark:bg-gray-700 w-full"></div>
        <div class="container mx-auto px-4 py-8 max-w-3xl space-y-4">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div class="space-y-3 mt-8">
            <div v-for="i in 8" :key="i" class="h-4 bg-gray-200 dark:bg-gray-700 rounded" :style="{ width: i % 3 === 0 ? '60%' : '100%' }"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- 404 -->
    <div v-else-if="notFound" class="container mx-auto px-4 py-24 text-center">
      <div class="text-6xl mb-4">📭</div>
      <h1 class="text-2xl font-black text-[var(--color-text-primary)] mb-2">مقاله یافت نشد</h1>
      <p class="text-[var(--color-text-secondary)] mb-6">این مقاله وجود ندارد یا حذف شده است.</p>
      <RouterLink :to="{ name: 'blog' }"
        class="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-dark transition-colors">
        بازگشت به بلاگ
      </RouterLink>
    </div>

    <!-- Article -->
    <article v-else-if="post">

      <!-- Hero image -->
      <div v-if="post.featuredImage" class="relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-gray-900">
        <img :src="post.featuredImage" :alt="post.title" class="w-full h-full object-cover opacity-80" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div class="absolute bottom-0 right-0 left-0 p-6 lg:p-10">
          <div class="container mx-auto max-w-3xl">
            <div class="flex flex-wrap gap-2 mb-3">
              <RouterLink
                v-for="tag in post.tags"
                :key="tag"
                :to="{ name: 'blog', query: { tag } }"
                class="text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors"
              >
                #{{ tag }}
              </RouterLink>
            </div>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {{ post.title }}
            </h1>
          </div>
        </div>
      </div>

      <!-- No-image title -->
      <div v-else class="bg-gradient-to-l from-brand to-brand-dark py-12 px-4">
        <div class="container mx-auto max-w-3xl">
          <div class="flex flex-wrap gap-2 mb-3">
            <RouterLink
              v-for="tag in post.tags"
              :key="tag"
              :to="{ name: 'blog', query: { tag } }"
              class="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors"
            >
              #{{ tag }}
            </RouterLink>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-white leading-tight">{{ post.title }}</h1>
        </div>
      </div>

      <!-- Content area -->
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-3xl mx-auto">

          <!-- Breadcrumb + meta -->
          <div class="flex items-center justify-between flex-wrap gap-3 mb-6 pb-6 border-b border-[var(--color-border)]">
            <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <RouterLink :to="{ name: 'home' }" class="hover:text-brand transition-colors">خانه</RouterLink>
              <span>/</span>
              <RouterLink :to="{ name: 'blog' }" class="hover:text-brand transition-colors">بلاگ</RouterLink>
              <span>/</span>
              <span class="text-[var(--color-text-primary)] line-clamp-1">{{ post.title }}</span>
            </div>

            <div class="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
              <span v-if="authorName" class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
                {{ authorName }}
              </span>
              <span class="flex items-center gap-1 font-fanum">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                </svg>
                {{ formatDate(post.publishedAt || post.createdAt) }}
              </span>
              <span v-if="post.viewCount" class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                  <path stroke-linecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ post.viewCount }} بازدید
              </span>
              <span class="flex items-center gap-1">
                ⏱ {{ readTime }} دقیقه
              </span>
            </div>
          </div>

          <!-- Excerpt -->
          <p v-if="post.excerpt" class="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8 font-light border-r-4 border-brand pr-4">
            {{ post.excerpt }}
          </p>

          <!-- Main content -->
          <div
            class="blog-content text-[var(--color-text-primary)] leading-loose"
            v-html="post.content"
          />

          <!-- Tags footer -->
          <div v-if="post.tags?.length" class="mt-10 pt-6 border-t border-[var(--color-border)]">
            <p class="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">موضوعات:</p>
            <div class="flex flex-wrap gap-2">
              <RouterLink
                v-for="tag in post.tags"
                :key="tag"
                :to="{ name: 'blog', query: { tag } }"
                class="text-sm bg-brand/10 text-brand px-3 py-1.5 rounded-xl hover:bg-brand hover:text-white transition-all"
              >
                #{{ tag }}
              </RouterLink>
            </div>
          </div>

          <!-- Share + back -->
          <div class="mt-10 pt-6 border-t border-[var(--color-border)] flex items-center justify-between flex-wrap gap-4">
            <RouterLink :to="{ name: 'blog' }"
              class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-brand transition-colors">
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
              </svg>
              بازگشت به بلاگ
            </RouterLink>

            <button @click="copyLink"
              class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-brand transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>
              </svg>
              {{ copied ? 'کپی شد ✓' : 'کپی لینک' }}
            </button>
          </div>
        </div>
      </div>
    </article>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBlogStore } from '@/stores/blog.store'

const route = useRoute()
const store = useBlogStore()

const notFound = ref(false)
const copied   = ref(false)

const post = computed(() => store.post)

const authorName = computed(() => {
  const a = post.value?.author
  if (!a) return ''
  if (a.firstName || a.lastName) return `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim()
  return a.phone ?? ''
})

const readTime = computed(() => {
  const words = (post.value?.content ?? '').replace(/<[^>]+>/g, '').split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
})

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  } catch { /* ignore */ }
}

async function loadPost(slug) {
  notFound.value = false
  try {
    await store.fetchPostBySlug(slug)
    if (!store.post) notFound.value = true
  } catch {
    notFound.value = true
  }
}

onMounted(() => loadPost(route.params.slug))
watch(() => route.params.slug, (slug) => { if (slug) loadPost(slug) })
</script>

<style>
.blog-content { font-size: 1rem; }
.blog-content h2 { font-size: 1.35rem; font-weight: 700; margin: 1.8rem 0 0.8rem; color: var(--color-text-primary); }
.blog-content h3 { font-size: 1.1rem; font-weight: 600; margin: 1.4rem 0 0.6rem; color: var(--color-text-primary); }
.blog-content p  { margin-bottom: 1rem; color: var(--color-text-primary); }
.blog-content ul, .blog-content ol { padding-right: 1.5rem; margin-bottom: 1rem; }
.blog-content li { margin-bottom: 0.5rem; }
.blog-content a  { color: var(--color-primary, #1B4F8A); text-decoration: underline; }
.blog-content a:hover { opacity: 0.8; }
.blog-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem 0; }
.blog-content blockquote {
  border-right: 4px solid var(--color-primary, #1B4F8A);
  padding-right: 1rem;
  color: var(--color-text-secondary);
  font-style: italic;
  margin: 1.5rem 0;
}
.blog-content code {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  padding: 0.15em 0.45em;
  border-radius: 4px;
  font-size: 0.85em;
  font-family: monospace;
}
.blog-content pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.75rem; overflow-x: auto; margin: 1rem 0; }
.blog-content hr  { border-color: var(--color-border); margin: 2rem 0; }
.blog-content strong { font-weight: 700; }
.blog-content em { font-style: italic; }
</style>
