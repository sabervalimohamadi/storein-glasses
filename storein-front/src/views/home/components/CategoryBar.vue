<template>
  <section class="py-5">
    <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      <RouterLink
        v-for="item in items"
        :key="item.slug"
        :to="{ name: 'category', params: { slug: item.slug } }"
        class="flex flex-col items-center gap-2 min-w-[72px] group cursor-pointer flex-shrink-0"
      >
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:shadow-md"
          :style="{ backgroundColor: item.color }"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-8 h-8 text-gray-700"
          >
            <!-- sunglasses -->
            <template v-if="item.icon === 'sunglasses'">
              <rect x="2" y="9" width="8" height="6" rx="3"/>
              <rect x="14" y="9" width="8" height="6" rx="3"/>
              <path d="M10 12h4"/>
              <path d="M2 11.5 Q0 11.5 0 13"/>
              <path d="M22 11.5 Q24 11.5 24 13"/>
            </template>
            <!-- prescription glasses -->
            <template v-else-if="item.icon === 'glasses'">
              <circle cx="7" cy="12" r="4"/>
              <circle cx="17" cy="12" r="4"/>
              <path d="M11 12h2"/>
              <path d="M3 10 Q1 9 0 10"/>
              <path d="M21 10 Q23 9 24 10"/>
            </template>
            <!-- contact lens -->
            <template v-else-if="item.icon === 'lens'">
              <circle cx="12" cy="12" r="8"/>
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 4v1M12 19v1M4 12h1M19 12h1"/>
            </template>
            <!-- eyeglass case -->
            <template v-else-if="item.icon === 'case'">
              <rect x="2" y="8" width="20" height="12" rx="4"/>
              <path d="M8 8V6a4 4 0 0 1 8 0v2"/>
              <path d="M7 14h10"/>
            </template>
            <!-- man -->
            <template v-else-if="item.icon === 'man'">
              <circle cx="12" cy="6" r="3"/>
              <path d="M8 21v-4a4 4 0 0 1 8 0v4"/>
              <path d="M9 21v-2M15 21v-2"/>
            </template>
            <!-- woman -->
            <template v-else-if="item.icon === 'woman'">
              <circle cx="12" cy="6" r="3"/>
              <path d="M9 4.5C9 4 10.5 3 12 3s3 1 3 1.5"/>
              <path d="M8 21l2-7h4l2 7"/>
              <path d="M10 14v-3a2 2 0 0 1 4 0v3"/>
            </template>
            <!-- kid -->
            <template v-else-if="item.icon === 'kid'">
              <circle cx="12" cy="7" r="3"/>
              <path d="M9 21l1.5-5h3L15 21"/>
              <path d="M10 16v-2.5a2 2 0 0 1 4 0V16"/>
              <path d="M6 13l2.5 1.5M18 13l-2.5 1.5"/>
            </template>
          </svg>
        </div>
        <span class="text-xs text-text-primary font-medium text-center leading-tight">
          {{ item.label }}
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
const items = [
  { label: 'عینک آفتابی',  slug: 'sunglasses',   color: '#FFF3CD', icon: 'sunglasses' },
  { label: 'عینک طبی',     slug: 'prescription',  color: '#D1ECF1', icon: 'glasses'    },
  { label: 'لنز طبی',      slug: 'contact-lens',  color: '#D4EDDA', icon: 'lens'       },
  { label: 'لوازم جانبی',  slug: 'accessories',   color: '#F8D7DA', icon: 'case'       },
  { label: 'مردانه',        slug: 'men',           color: '#CCE5FF', icon: 'man'        },
  { label: 'زنانه',         slug: 'women',         color: '#F3E2F9', icon: 'woman'      },
  { label: 'بچگانه',        slug: 'kids',          color: '#FFF8E1', icon: 'kid'        },
]
</script>
