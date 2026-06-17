<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl">

    <!-- Loading -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div class="h-8 bg-surface rounded-lg w-2/3" />
      <div class="h-4 bg-surface rounded w-full" />
      <div class="h-4 bg-surface rounded w-5/6" />
      <div class="h-4 bg-surface rounded w-4/6" />
    </div>

    <!-- 404 -->
    <div v-else-if="!page" class="text-center py-20">
      <p class="text-5xl mb-4">😕</p>
      <h1 class="text-xl font-bold text-text-primary mb-2">صفحه یافت نشد</h1>
      <RouterLink :to="{ name: 'home' }" class="text-primary hover:underline text-sm">
        بازگشت به صفحه اصلی
      </RouterLink>
    </div>

    <!-- Content -->
    <article v-else>
      <h1 class="text-2xl font-black text-text-primary mb-6 leading-snug">
        {{ page.title }}
      </h1>
      <div
        class="prose-page text-text-primary text-sm leading-loose"
        v-html="page.content"
      />
    </article>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute }         from 'vue-router'
import { pageService }      from '@/services/page.service'
import { useSettingsStore } from '@/stores/settings.store'

const route         = useRoute()
const settingsStore = useSettingsStore()
const page    = ref(null)
const loading = ref(true)
const prevTitle = document.title

async function load(slug) {
  loading.value = true
  page.value    = null
  try {
    const { data } = await pageService.getBySlug(slug)
    page.value = data
    const pageTitle = data.metaTitle || data.title || ''
    document.title = pageTitle ? `${settingsStore.siteName} - ${pageTitle}` : settingsStore.siteName
  } catch {
    // page stays null → shows 404 block
  } finally {
    loading.value = false
  }
}

onUnmounted(() => { document.title = prevTitle })

onMounted(() => load(route.params.slug))
watch(() => route.params.slug, (s) => s && load(s))
</script>

<style>
/* Render HTML from TipTap */
.prose-page h2 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
.prose-page h3 { font-size: 1.1rem;  font-weight: 600; margin: 1rem 0 0.4rem; }
.prose-page p  { margin-bottom: 0.75rem; }
.prose-page ul { list-style: disc;    padding-right: 1.5rem; margin-bottom: 0.75rem; }
.prose-page ol { list-style: decimal; padding-right: 1.5rem; margin-bottom: 0.75rem; }
.prose-page blockquote {
  border-right: 3px solid var(--color-primary);
  padding-right: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0.75rem 0;
}
.prose-page a   { color: var(--color-primary); text-decoration: underline; }
.prose-page hr  { border-color: var(--color-border); margin: 1.25rem 0; }
.prose-page strong { font-weight: 700; }
.prose-page em     { font-style: italic; }
.prose-page s      { text-decoration: line-through; }
</style>
