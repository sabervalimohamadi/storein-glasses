<template>
  <section v-if="items.length" class="cat-bar">
    <div class="cat-bar__scroll">
      <NuxtLink
        v-for="item in items"
        :key="item.slug"
        :to="`/category/${item.slug}`"
        class="cat-item"
      >
        <div class="cat-item__ico">
          <img v-if="item.image" :src="item.image" :alt="item.name" class="cat-item__img" />
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
               class="cat-item__svg">
            <rect x="2" y="9" width="8" height="6" rx="3"/>
            <rect x="14" y="9" width="8" height="6" rx="3"/>
            <path d="M10 12h4"/>
          </svg>
        </div>
        <span class="cat-item__lbl">{{ item.name }}</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categoryService } from '~/services/category.service'

const items = ref([])

onMounted(async () => {
  try {
    const { data } = await categoryService.getRoots()
    if (Array.isArray(data)) items.value = data
  } catch {}
})
</script>

<style scoped>
.cat-bar {
  padding: 1.25rem 0 0.5rem;
}

.cat-bar__scroll {
  display: flex;
  gap: 0.625rem;
  overflow-x: auto;
  padding: 0.5rem 0.25rem 0.75rem;
  scrollbar-width: none;
}
.cat-bar__scroll::-webkit-scrollbar { display: none; }

.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 72px;
  flex-shrink: 0;
  text-decoration: none;
  cursor: pointer;
}

.cat-item__ico {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.cat-item:hover .cat-item__ico {
  transform: translateY(-5px);
  box-shadow: 0 10px 24px rgba(0,0,0,0.14);
}

.cat-item__svg {
  width: 26px;
  height: 26px;
}

.cat-item__lbl {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
  white-space: nowrap;
  letter-spacing: 0.01em;
  transition: color 0.2s ease;
}
.cat-item:hover .cat-item__lbl {
  color: rgb(var(--color-brand-rgb));
}
</style>
