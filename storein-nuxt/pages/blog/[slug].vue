<template>
  <div class="min-h-screen bg-[var(--color-bg)]">

    <template v-if="store.loading">
      <div class="animate-pulse">
        <div class="h-64 bg-gray-300 dark:bg-gray-700 w-full"></div>
        <div class="container mx-auto px-4 py-8 max-w-3xl space-y-4">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </template>

    <div v-else-if="notFound" class="container mx-auto px-4 py-24 text-center">
      <div class="text-6xl mb-4">📭</div>
      <h1 class="text-2xl font-black text-[var(--color-text-primary)] mb-2">مقاله یافت نشد</h1>
      <NuxtLink to="/blog" class="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-dark transition-colors">
        بازگشت به بلاگ
      </NuxtLink>
    </div>

    <article v-else-if="post">
      <div v-if="post.featuredImage" class="relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-gray-900">
        <img :src="post.featuredImage" :alt="post.title" class="w-full h-full object-cover opacity-80" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div class="absolute bottom-0 right-0 left-0 p-6 lg:p-10">
          <div class="container mx-auto max-w-3xl">
            <div class="flex flex-wrap gap-2 mb-3">
              <NuxtLink v-for="tag in post.tags" :key="tag" :to="`/blog?tag=${tag}`" class="text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors">#{{ tag }}</NuxtLink>
            </div>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">{{ post.title }}</h1>
          </div>
        </div>
      </div>
      <div v-else class="bg-gradient-to-l from-brand to-brand-dark py-12 px-4">
        <div class="container mx-auto max-w-3xl">
          <h1 class="text-2xl sm:text-3xl font-black text-white leading-tight">{{ post.title }}</h1>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8">
        <div class="max-w-3xl mx-auto">
          <div class="flex items-center justify-between flex-wrap gap-3 mb-6 pb-6 border-b border-[var(--color-border)]">
            <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <NuxtLink to="/" class="hover:text-brand">خانه</NuxtLink>
              <span>/</span>
              <NuxtLink to="/blog" class="hover:text-brand">بلاگ</NuxtLink>
              <span>/</span>
              <span class="text-[var(--color-text-primary)] line-clamp-1">{{ post.title }}</span>
            </div>
            <div class="text-xs text-[var(--color-text-secondary)]">
              <span class="flex items-center gap-1 font-fanum">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
            </div>
          </div>

          <p v-if="post.excerpt" class="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8 font-light border-r-4 border-brand pr-4">{{ post.excerpt }}</p>

          <div class="blog-content text-[var(--color-text-primary)] leading-loose" v-html="post.content" />

          <div v-if="post.tags?.length" class="mt-10 pt-6 border-t border-[var(--color-border)]">
            <div class="flex flex-wrap gap-2">
              <NuxtLink v-for="tag in post.tags" :key="tag" :to="`/blog?tag=${tag}`" class="text-sm bg-brand/10 text-brand px-3 py-1.5 rounded-xl hover:bg-brand hover:text-white transition-all">#{{ tag }}</NuxtLink>
            </div>
          </div>

          <div class="mt-10 pt-6 border-t border-[var(--color-border)] flex items-center justify-between flex-wrap gap-4">
            <NuxtLink to="/blog" class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-brand transition-colors">
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
              بازگشت به بلاگ
            </NuxtLink>
            <button @click="copyLink" class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-brand transition-colors">
              {{ copied ? 'کپی شد ✓' : 'کپی لینک' }}
            </button>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const route         = useRoute()
const config        = useRuntimeConfig()
const store         = useBlogStore()
const settingsStore = useSettingsStore()

const notFound = ref(false)
const copied   = ref(false)

const post = computed(() => store.post)

useSeoMeta({
  title:                () => post.value?.metaTitle    || post.value?.title    || '',
  description:          () => post.value?.metaDescription || post.value?.excerpt || '',
  ogTitle:              () => post.value?.title    || '',
  ogDescription:        () => post.value?.excerpt  || '',
  ogImage:              () => post.value?.featuredImage || undefined,
  ogType:               'article',
  articlePublishedTime: () => post.value?.publishedAt || undefined,
  ogUrl:                () => `${config.public.siteUrl}/blog/${route.params.slug}`,
})
useHead({
  link: [{ rel: 'canonical', href: () => `${config.public.siteUrl}/blog/${route.params.slug}` }],
  script: computed(() => {
    const p = post.value
    if (!p) return []
    return [{
      type: 'application/ld+json',
      key: 'jsonld-blog',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: p.title, description: p.excerpt, image: p.featuredImage || null,
        datePublished: p.publishedAt, dateModified: p.updatedAt,
        url: `${config.public.siteUrl}/blog/${p.slug}`,
        author:    { '@type': 'Organization', name: settingsStore.siteName },
        publisher: { '@type': 'Organization', name: settingsStore.siteName, logo: { '@type': 'ImageObject', url: `${config.public.siteUrl}/favicon.svg` } },
        keywords: (p.tags || []).join(', '),
      }),
    }]
  }),
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
  } catch { notFound.value = true }
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
.blog-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem 0; }
.blog-content blockquote { border-right: 4px solid var(--color-primary, #1B4F8A); padding-right: 1rem; color: var(--color-text-secondary); font-style: italic; margin: 1.5rem 0; }
.blog-content code { background: var(--color-bg); border: 1px solid var(--color-border); padding: 0.15em 0.45em; border-radius: 4px; font-size: 0.85em; }
.blog-content pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.75rem; overflow-x: auto; margin: 1rem 0; }
.blog-content hr { border-color: var(--color-border); margin: 2rem 0; }
</style>
