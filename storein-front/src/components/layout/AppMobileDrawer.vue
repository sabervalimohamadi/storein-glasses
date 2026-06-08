<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="uiStore.isMenuOpen"
        class="fixed inset-0 bg-black/50 z-[250] md:hidden"
        @click="uiStore.toggleMenu()"
      />
    </Transition>

    <!-- Drawer -->
    <Transition name="drawer">
      <nav
        v-if="uiStore.isMenuOpen"
        class="fixed top-0 right-0 bottom-0 w-72 z-[260] md:hidden flex flex-col overflow-y-auto"
        style="background-color: var(--color-card); border-left: 1px solid var(--color-border);"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-4" style="border-bottom: 1px solid var(--color-border);">
          <RouterLink :to="{ name: 'home' }" @click="close" class="flex flex-col leading-tight">
            <span class="text-brand font-bold text-lg">استورین</span>
            <span class="text-xs" style="color: var(--color-text-secondary);">فروشگاه تخصصی عینک</span>
          </RouterLink>
          <button
            @click="close"
            class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style="color: var(--color-text-secondary);"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- User row -->
        <div class="px-4 py-3" style="border-bottom: 1px solid var(--color-border);">
          <template v-if="authStore.isLoggedIn">
            <p class="text-xs mb-0.5" style="color: var(--color-text-secondary);">سلام،</p>
            <p class="font-semibold text-sm" style="color: var(--color-text-primary);">{{ userName }}</p>
          </template>
          <RouterLink v-else :to="{ name: 'login' }" @click="close"
            class="flex items-center gap-2 text-brand font-medium text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
            </svg>
            ورود | ثبت‌نام
          </RouterLink>
        </div>

        <!-- Quick links -->
        <div class="py-2" style="border-bottom: 1px solid var(--color-border);">
          <RouterLink :to="{ name: 'blog' }" @click="close"
            class="flex items-center gap-3 px-4 py-2.5 text-sm"
            style="color: var(--color-text-primary);"
            @mouseenter="e => e.currentTarget.style.backgroundColor = 'var(--color-bg)'"
            @mouseleave="e => e.currentTarget.style.backgroundColor = ''">
            <span>📝</span> بلاگ
          </RouterLink>
        </div>

        <!-- Categories -->
        <div class="py-2" style="border-top: 1px solid var(--color-border);" v-if="categories.length">
          <p class="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-disabled);">دسته‌بندی‌ها</p>

          <div v-for="cat in categories" :key="cat._id">
            <!-- Category row -->
            <div class="flex items-center transition-colors" style="color: var(--color-text-primary);">
              <!-- Category name → navigates -->
              <RouterLink
                :to="{ name: 'category', params: { slug: cat.slug } }"
                @click="close"
                class="flex-1 px-4 py-2.5 text-sm"
              >
                {{ cat.name }}
              </RouterLink>
              <!-- Chevron → expands subcategories -->
              <button
                v-if="cat.children?.length"
                @click.stop="toggleCat(cat._id)"
                class="px-4 py-2.5 transition-transform duration-200"
                :style="expandedCats.has(cat._id) ? 'transform: rotate(-90deg); color: var(--color-brand);' : 'color: var(--color-text-disabled);'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
                </svg>
              </button>
            </div>

            <!-- Subcategories -->
            <div v-if="expandedCats.has(cat._id) && cat.children?.length"
                 style="background-color: var(--color-bg);">
              <RouterLink
                v-for="child in cat.children"
                :key="child._id"
                :to="{ name: 'category', params: { slug: child.slug } }"
                @click="close"
                class="flex items-center gap-2 pr-8 pl-4 py-2.5 text-sm transition-colors"
                style="color: var(--color-text-secondary);"
                @mouseenter="e => e.currentTarget.style.color = 'var(--color-brand)'"
                @mouseleave="e => e.currentTarget.style.color = 'var(--color-text-secondary)'"
              >
                <span class="w-1 h-1 rounded-full flex-shrink-0" style="background-color: var(--color-text-disabled);"></span>
                {{ child.name }}
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- User actions -->
        <div v-if="authStore.isLoggedIn" class="py-2 mt-auto" style="border-top: 1px solid var(--color-border);">
          <RouterLink :to="{ name: 'user-profile' }" @click="close"
            class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
            style="color: var(--color-text-primary);"
            @mouseenter="e => e.currentTarget.style.backgroundColor = 'var(--color-bg)'"
            @mouseleave="e => e.currentTarget.style.backgroundColor = ''">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" style="color: var(--color-text-secondary);">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
            </svg>
            پروفایل من
          </RouterLink>
          <button @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error transition-colors hover:bg-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
            </svg>
            خروج از حساب
          </button>
        </div>
      </nav>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute  } from 'vue-router'
import { useUiStore }       from '@/stores/ui.store'
import { useAuthStore }     from '@/stores/auth.store'
import { useCategoryStore } from '@/stores/category.store'
import { storeToRefs } from 'pinia'

const router        = useRouter()
const route         = useRoute()
const uiStore       = useUiStore()
const authStore     = useAuthStore()
const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)


const userName = computed(() => {
  const u = authStore.user
  if (u?.firstName && u?.lastName) return `${u.firstName} ${u.lastName}`
  if (u?.firstName) return u.firstName
  return u?.phone || 'کاربر'
})


const expandedCats = ref(new Set())

function toggleCat(id) {
  const next = new Set(expandedCats.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedCats.value = next
}

function close() {
  uiStore.isMenuOpen = false
  expandedCats.value = new Set()
}

async function handleLogout() {
  close()
  authStore.logout()
  router.push({ name: 'home' })
}
</script>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.25s ease; }
.backdrop-enter-from, .backdrop-leave-to       { opacity: 0; }

.drawer-enter-active, .drawer-leave-active { transition: transform 0.25s ease; }
.drawer-enter-from, .drawer-leave-to       { transform: translateX(100%); }
</style>
