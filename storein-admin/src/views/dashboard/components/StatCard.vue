<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    :to="to"
    :class="[
      'admin-card flex items-start gap-4 transition-all duration-200',
      to ? 'hover:shadow-md hover:border-primary/40 cursor-pointer group' : 'hover:shadow-md',
    ]"
  >

    <!-- Icon circle -->
    <div :class="['w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl transition-transform', iconBg, to ? 'group-hover:scale-110' : '']">
      {{ icon }}
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 pt-0.5">

      <template v-if="loading">
        <AdminSkeleton height="1rem" width="60%" class="mb-2" />
        <AdminSkeleton height="1.75rem" class="mb-2" />
        <AdminSkeleton height="0.875rem" width="50%" />
      </template>

      <template v-else>
        <p class="text-text-secondary text-sm mb-1">{{ title }}</p>

        <p class="text-2xl font-black text-text-primary font-fanum leading-tight mb-1 truncate">
          {{ value }}
        </p>

        <div class="flex items-center gap-2 flex-wrap">
          <span v-if="subLabel && subValue" class="text-text-disabled text-xs">
            {{ subLabel }}:
            <span class="text-text-secondary font-medium font-fanum">{{ subValue }}</span>
          </span>

          <span
            v-if="trend !== undefined && trend !== null"
            :class="[
              'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full font-fanum',
              trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
            ]"
          >
            <span>{{ trend >= 0 ? '↑' : '↓' }}</span>
            {{ Math.abs(trend) }}٪
          </span>
        </div>
      </template>
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const props = defineProps({
  title:    String,
  value:    { type: String, default: '—' },
  subLabel: String,
  subValue: String,
  icon:     { type: String, default: '📊' },
  color:    { type: String, default: 'blue' },
  loading:  { type: Boolean, default: false },
  trend:    { type: Number, default: null },
  to:       { type: [String, Object], default: null },
})

const iconBg = computed(() => ({
  blue:   'bg-blue-100',
  green:  'bg-green-100',
  yellow: 'bg-yellow-100',
  purple: 'bg-purple-100',
  red:    'bg-red-100',
}[props.color] ?? 'bg-blue-100'))
</script>
