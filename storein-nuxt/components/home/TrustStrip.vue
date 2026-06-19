<template>
  <section class="trust">
    <div class="trust__grid">
      <div
        v-for="(item, idx) in trustItems"
        :key="idx"
        class="trust__card"
      >
        <div class="trust__ico" :style="{ backgroundColor: item.bgColor }">
          <span class="trust__emoji" role="img" :aria-label="item.title">{{ item.icon }}</span>
        </div>
        <div class="trust__body">
          <h4 class="trust__name">{{ item.title }}</h4>
          <p class="trust__sub">{{ item.subtitle }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useSettingsStore } from '~/stores/settings.store'
const { trustItems } = useSettingsStore()
</script>

<style scoped>
/* ── Section ───────────────────────────────────────── */
.trust {
  padding: 1.25rem 0 0.5rem;
}

/* ── Grid ──────────────────────────────────────────── */
.trust__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .trust__grid { grid-template-columns: repeat(4, 1fr); gap: 1rem; }
}

/* ── Card ──────────────────────────────────────────── */
.trust__card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.1rem;
  border-radius: 16px;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.22s ease, border-color 0.22s ease;
}

.trust__card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  border-color: rgba(var(--color-brand-rgb), 0.2);
}

/* ── Icon ──────────────────────────────────────────── */
.trust__ico {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trust__emoji {
  font-size: 1.375rem;
  line-height: 1;
  user-select: none;
}

/* ── Text ──────────────────────────────────────────── */
.trust__body {
  min-width: 0;
}

.trust__name {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 3px;
  line-height: 1.3;
}

.trust__sub {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}
</style>
