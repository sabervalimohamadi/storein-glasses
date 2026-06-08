<template>
  <nav class="hidden md:block border-t border-surface-border" style="background-color: var(--color-card);">
    <div class="container-main">
      <ul class="flex items-stretch overflow-x-auto scrollbar-hide">
        <!-- Fixed quick links -->
        <li v-for="link in quickLinks" :key="link.label">
          <RouterLink
            :to="link.to"
            :class="[
              'flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
              'hover:text-brand hover:border-brand',
              isLinkActive(link) ? 'text-brand border-brand' : 'text-text-secondary border-transparent',
            ]"
          >
            {{ link.label }}
          </RouterLink>
        </li>

        <!-- Dynamic categories with mega-dropdown -->
        <li
          v-for="cat in categories"
          :key="cat._id"
          class="relative"
          @mouseenter="onEnter(cat._id)"
          @mouseleave="onLeave"
        >
          <RouterLink
            :to="{ name: 'category', params: { slug: cat.slug } }"
            :class="[
              'flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
              'hover:text-brand hover:border-brand',
              hoveredId === cat._id ? 'text-brand border-brand' : 'text-text-secondary border-transparent',
            ]"
          >
            {{ cat.name }}
            <svg v-if="cat.children?.length" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
              :class="['w-3.5 h-3.5 transition-transform duration-200', hoveredId === cat._id ? 'rotate-180' : '']"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
            </svg>
          </RouterLink>

          <!-- Mega-dropdown -->
          <Transition name="mega">
            <div
              v-if="hoveredId === cat._id && cat.children?.length"
              class="absolute top-full right-0 z-dropdown shadow-dropdown rounded-b-xl border border-surface-border border-t-0 p-4 min-w-56"
              style="background-color: var(--color-card);"
              @mouseenter="onEnter(cat._id)"
              @mouseleave="onLeave"
            >
              <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                <RouterLink
                  v-for="child in cat.children"
                  :key="child._id"
                  :to="{ name: 'category', params: { slug: child.slug } }"
                  class="text-sm text-text-secondary hover:text-brand py-1.5 px-2 rounded-lg hover:bg-surface transition-colors whitespace-nowrap"
                  @click="hoveredId = null"
                >
                  {{ child.name }}
                </RouterLink>
              </div>
            </div>
          </Transition>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCategoryStore } from '@/stores/category.store'
import { storeToRefs } from 'pinia'

const route         = useRoute()
const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)

const hoveredId = ref(null)
let closeTimer  = null

const quickLinks = [
  { label: 'صفحه اصلی',   to: { name: 'home' } },
  { label: 'عینک آفتابی', to: { name: 'category', params: { slug: 'sunglasses' } } },
  { label: 'عینک طبی',    to: { name: 'category', params: { slug: 'prescription' } } },
  { label: 'لنز طبی',     to: { name: 'category', params: { slug: 'contact-lens' } } },
  { label: 'لوازم جانبی', to: { name: 'category', params: { slug: 'accessories' } } },
  { label: 'بلاگ',        to: { name: 'blog' } },
]

function isLinkActive(link) {
  if (link.to?.name === 'home') return route.name === 'home'
  if (link.to?.name === 'blog') return route.name === 'blog' || route.name === 'blog-detail'
  if (link.to?.params?.slug)   return route.params?.slug === link.to.params.slug
  return false
}

function onEnter(id) {
  clearTimeout(closeTimer)
  hoveredId.value = id
}

function onLeave() {
  closeTimer = setTimeout(() => { hoveredId.value = null }, 200)
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.mega-enter-active,
.mega-leave-active { transition: all 0.15s ease; }
.mega-enter-from,
.mega-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
