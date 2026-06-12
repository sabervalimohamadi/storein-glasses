<template>
  <li class="relative" @mouseenter="onEnter" @mouseleave="onLeave">
    <RouterLink
      :to="{ name: 'category', params: { slug: item.slug } }"
      @click="$emit('close')"
      :class="[
        'flex items-center justify-between gap-2 w-full text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap',
        open && item.children?.length
          ? 'text-brand bg-brand/5'
          : 'text-text-secondary hover:text-brand hover:bg-brand/5',
      ]"
    >
      {{ item.name }}
      <svg v-if="item.children?.length"
        class="w-3 h-3 flex-shrink-0"
        style="transform: rotate(90deg);"
        fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
      </svg>
    </RouterLink>

    <!-- Recursive sub-panel -->
    <div
      v-if="item.children?.length"
      v-show="open"
      class="absolute top-0 z-[320] min-w-44 rounded-xl shadow-xl border border-surface-border p-1.5"
      style="right: calc(100% + 2px); background-color: var(--color-card);"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    >
      <ul class="flex flex-col gap-0.5">
        <NavDropdownItem
          v-for="child in item.children"
          :key="child._id"
          :item="child"
          @close="$emit('close')"
        />
      </ul>
    </div>
  </li>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ item: { type: Object, required: true } })
defineEmits(['close'])

const open = ref(false)
let timer  = null

function onEnter() {
  clearTimeout(timer)
  open.value = true
}
function onLeave() {
  timer = setTimeout(() => { open.value = false }, 150)
}
</script>
