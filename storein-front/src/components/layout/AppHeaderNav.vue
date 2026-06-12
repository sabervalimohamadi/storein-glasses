<template>
  <nav class="hidden md:block border-t border-surface-border" style="background-color: var(--color-card);">
    <div class="container-main flex items-stretch">

      <!-- Quick links (صفحه اصلی، بلاگ) -->
      <div class="flex items-stretch">
        <RouterLink
          v-for="link in quickLinks"
          :key="link.label"
          :to="link.to"
          :class="[
            'flex items-center px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2',
            isLinkActive(link)
              ? 'text-brand border-brand'
              : 'text-text-secondary border-transparent hover:text-brand hover:border-brand/40',
          ]"
        >
          {{ link.label }}
        </RouterLink>
      </div>

      <!-- Divider -->
      <div class="flex items-center px-2">
        <span class="w-px h-5 rounded-full" style="background-color: var(--color-border);"></span>
      </div>

      <!-- Dynamic categories -->
      <div class="flex items-stretch flex-1">
        <div
          v-for="cat in categories"
          :key="cat._id"
          class="relative"
          @mouseenter="onEnter(cat._id)"
          @mouseleave="onLeave"
        >
          <RouterLink
            :to="{ name: 'category', params: { slug: cat.slug } }"
            :class="[
              'flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap transition-all duration-200 border-b-2 h-full',
              hoveredId === cat._id
                ? 'text-brand border-brand font-semibold'
                : 'text-text-secondary border-transparent font-medium hover:text-text-primary hover:border-brand/30',
            ]"
          >
            <!-- category icon if exists -->
            <span v-if="cat.icon" class="text-base leading-none">{{ cat.icon }}</span>
            {{ cat.name }}
            <svg
              v-if="cat.children?.length"
              class="w-3 h-3 flex-shrink-0 transition-transform duration-200"
              :class="hoveredId === cat._id ? 'rotate-180 text-brand' : 'text-text-disabled'"
              fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
            </svg>
          </RouterLink>

          <!-- Dropdown panel -->
          <div
            v-show="hoveredId === cat._id && cat.children?.length"
            class="nav-drop absolute top-full right-0 z-[300] min-w-[11rem] pt-1"
            @mouseenter="onEnter(cat._id)"
            @mouseleave="onLeave"
          >
            <div class="rounded-xl shadow-xl border border-surface-border"
                 style="background-color: var(--color-card);">
              <!-- Category header -->
              <div class="px-4 py-2.5 border-b border-surface-border flex items-center gap-2 rounded-t-xl"
                   style="background-color: var(--color-card);">
                <span v-if="cat.icon" class="text-base leading-none">{{ cat.icon }}</span>
                <span class="text-xs font-bold text-brand tracking-wide">{{ cat.name }}</span>
              </div>
              <!-- Items -->
              <ul class="p-1.5 flex flex-col gap-0.5">
                <NavDropdownItem
                  v-for="child in cat.children"
                  :key="child._id"
                  :item="child"
                  @close="hoveredId = null"
                />
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCategoryStore } from '@/stores/category.store'
import { storeToRefs } from 'pinia'
import NavDropdownItem from '@/components/layout/NavDropdownItem.vue'

const route         = useRoute()
const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)

const hoveredId = ref(null)
let closeTimer  = null

const quickLinks = [
  { label: 'صفحه اصلی', to: { name: 'home' } },
  { label: 'بلاگ',      to: { name: 'blog' } },
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
  closeTimer = setTimeout(() => { hoveredId.value = null }, 150)
}
</script>

<style scoped>
/* Dropdown fade-in via CSS — no v-show conflict */
.nav-drop {
  animation: dropIn 0.15s ease;
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
