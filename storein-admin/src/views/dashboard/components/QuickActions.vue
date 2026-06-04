<template>
  <div class="admin-card">
    <h3 class="section-title mb-4">دسترسی سریع</h3>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <RouterLink
        v-for="action in actions"
        :key="action.label"
        :to="action.to"
        :class="[
          'flex flex-col items-center gap-2 p-4 rounded-xl border-2',
          'transition-all duration-200 text-center group',
          'border-border hover:border-primary/40 hover:bg-primary/5',
        ]"
      >
        <div class="relative">
          <span class="text-2xl">{{ action.icon }}</span>
          <span
            v-if="action.badge"
            class="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1
                   bg-error text-white text-[10px] font-bold rounded-full
                   flex items-center justify-center font-fanum"
          >
            {{ action.badge > 99 ? '99+' : action.badge }}
          </span>
        </div>
        <span class="text-xs font-medium text-text-secondary group-hover:text-primary transition-colors">
          {{ action.label }}
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pendingOrders:  { type: Number, default: 0 },
  pendingReviews: { type: Number, default: 0 },
})

const actions = computed(() => [
  {
    icon:  '➕',
    label: 'محصول جدید',
    to:    { name: 'product-create' },
    badge: null,
  },
  {
    icon:  '🛒',
    label: 'سفارشات جدید',
    to:    { name: 'orders' },
    badge: props.pendingOrders || null,
  },
  {
    icon:  '⭐',
    label: 'نظرات در انتظار',
    to:    { name: 'reviews' },
    badge: props.pendingReviews || null,
  },
  {
    icon:  '🏷️',
    label: 'دسته‌بندی‌ها',
    to:    { name: 'categories' },
    badge: null,
  },
])
</script>
