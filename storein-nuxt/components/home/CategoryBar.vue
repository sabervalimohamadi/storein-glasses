<template>
  <section class="cat-bar">
    <div class="cat-bar__scroll">
      <NuxtLink
        v-for="item in items"
        :key="item.slug"
        :to="`/category/${item.slug}`"
        class="cat-item"
      >
        <div class="cat-item__ico" :style="{ backgroundColor: item.bg }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
               class="cat-item__svg" :style="{ color: item.fg }">
            <template v-if="item.icon === 'sunglasses'">
              <rect x="2" y="9" width="8" height="6" rx="3"/>
              <rect x="14" y="9" width="8" height="6" rx="3"/>
              <path d="M10 12h4"/>
              <path d="M2 11.5 Q0 11.5 0 13"/>
              <path d="M22 11.5 Q24 11.5 24 13"/>
            </template>
            <template v-else-if="item.icon === 'glasses'">
              <circle cx="7" cy="12" r="4"/>
              <circle cx="17" cy="12" r="4"/>
              <path d="M11 12h2"/>
              <path d="M3 10 Q1 9 0 10"/>
              <path d="M21 10 Q23 9 24 10"/>
            </template>
            <template v-else-if="item.icon === 'lens'">
              <circle cx="12" cy="12" r="8"/>
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 4v1M12 19v1M4 12h1M19 12h1"/>
            </template>
            <template v-else-if="item.icon === 'case'">
              <rect x="2" y="8" width="20" height="12" rx="4"/>
              <path d="M8 8V6a4 4 0 0 1 8 0v2"/>
              <path d="M7 14h10"/>
            </template>
            <template v-else-if="item.icon === 'man'">
              <circle cx="12" cy="6" r="3"/>
              <path d="M8 21v-4a4 4 0 0 1 8 0v4"/>
              <path d="M9 21v-2M15 21v-2"/>
            </template>
            <template v-else-if="item.icon === 'woman'">
              <circle cx="12" cy="6" r="3"/>
              <path d="M8 21l2-7h4l2 7"/>
              <path d="M10 14v-3a2 2 0 0 1 4 0v3"/>
            </template>
            <template v-else-if="item.icon === 'kid'">
              <circle cx="12" cy="7" r="3"/>
              <path d="M9 21l1.5-5h3L15 21"/>
              <path d="M6 13l2.5 1.5M18 13l-2.5 1.5"/>
            </template>
          </svg>
        </div>
        <span class="cat-item__lbl">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
const items = [
  { label: 'عینک آفتابی', slug: 'sunglasses',  bg: '#FEF3C7', fg: '#92400E', icon: 'sunglasses' },
  { label: 'عینک طبی',    slug: 'prescription', bg: '#DBEAFE', fg: '#1E40AF', icon: 'glasses'    },
  { label: 'لنز طبی',     slug: 'contact-lens', bg: '#D1FAE5', fg: '#065F46', icon: 'lens'       },
  { label: 'لوازم جانبی', slug: 'accessories',  bg: '#FCE7F3', fg: '#9D174D', icon: 'case'       },
  { label: 'مردانه',       slug: 'men',          bg: '#EFF6FF', fg: '#1D4ED8', icon: 'man'        },
  { label: 'زنانه',        slug: 'women',        bg: '#F5F3FF', fg: '#6D28D9', icon: 'woman'      },
  { label: 'بچگانه',       slug: 'kids',         bg: '#FFF7ED', fg: '#C2410C', icon: 'kid'        },
]
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
