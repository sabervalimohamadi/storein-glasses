<template>
  <div class="container-main py-8">

    <!-- Header -->
    <div class="nv__header">
      <div class="nv__title-wrap">
        <div class="nv__icon-wrap" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="1.5" stroke="currentColor" class="nv__icon-svg">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
          </svg>
        </div>
        <div>
          <h1 class="nv__title">اعلان‌ها</h1>
          <p v-if="unreadCount > 0" class="nv__sub font-fanum">
            {{ unreadCount }} اعلان خوانده‌نشده
          </p>
          <p v-else class="nv__sub">همه اعلان‌ها خوانده شده‌اند</p>
        </div>
      </div>

      <button
        v-if="unreadCount > 0"
        class="nv__mark-all"
        :disabled="markingAll"
        @click="handleMarkAll"
      >
        <svg v-if="markingAll" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        همه را خواندم
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="nv__list">
      <div v-for="i in 6" :key="i" class="nv__skeleton">
        <div class="nv__skeleton-dot" />
        <div class="nv__skeleton-body">
          <div class="nv__skeleton-line" style="width:60%" />
          <div class="nv__skeleton-line" style="width:85%;margin-top:6px;height:0.7rem;opacity:0.5" />
          <div class="nv__skeleton-line" style="width:30%;margin-top:6px;height:0.65rem;opacity:0.3" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!notifications.length" class="nv__empty">
      <span class="nv__empty-icon">🔔</span>
      <p class="nv__empty-title">هیچ اعلانی وجود ندارد</p>
      <p class="nv__empty-sub">اعلان‌های جدید در اینجا نمایش داده می‌شوند</p>
      <RouterLink :to="{ name: 'home' }" class="nv__back-btn">بازگشت به صفحه اصلی</RouterLink>
    </div>

    <!-- Notification list -->
    <div v-else class="nv__list">
      <button
        v-for="n in notifications"
        :key="n._id"
        class="nv__item"
        :class="{ 'nv__item--unread': !n.isRead }"
        @click="handleClick(n)"
      >
        <!-- Unread indicator -->
        <span class="nv__dot" :class="n.isRead ? 'nv__dot--read' : 'nv__dot--unread'" />

        <!-- Type icon -->
        <div class="nv__type-icon" :class="typeIconClass(n.type)">
          <svg v-if="n.type === 'order_update'" xmlns="http://www.w3.org/2000/svg"
               fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <svg v-else-if="n.type === 'promo'" xmlns="http://www.w3.org/2000/svg"
               fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
          </svg>
        </div>

        <!-- Content -->
        <div class="nv__content">
          <p class="nv__item-title">{{ n.title }}</p>
          <p class="nv__item-body">{{ n.body }}</p>
          <p class="nv__item-time font-fanum">{{ timeAgo(n.createdAt) }}</p>
        </div>

        <!-- Chevron (only for navigable notifications) -->
        <svg
          v-if="resolveRoute(n)"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke-width="2" stroke="currentColor" class="nv__chevron rtl:rotate-180"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
        </svg>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }     from 'vue-router'
import { storeToRefs }   from 'pinia'
import { useNotificationStore } from '@/stores/notification.store'
import { logger } from '@/utils/logger'

const CTX = 'NotificationsView'

const router     = useRouter()
const notifStore = useNotificationStore()

const { notifications, loading, unreadCount } = storeToRefs(notifStore)
const markingAll = ref(false)

onMounted(async () => {
  logger.info('notifications page mounted', {}, CTX)
  if (!notifStore.fetched) {
    logger.debug('fetching notifications on mount', {}, CTX)
    await notifStore.fetchNotifications()
    logger.debug('notifications fetched', { count: notifications.value.length }, CTX)
  }
})

async function handleClick(n) {
  logger.debug('notification item clicked', { id: n._id, type: n.type, isRead: n.isRead }, CTX)
  if (!n.isRead) {
    await notifStore.markRead(n._id)
  }
  const dest = resolveRoute(n)
  if (dest) {
    logger.info('navigating from notification', { dest, type: n.type }, CTX)
    router.push(dest)
  }
}

async function handleMarkAll() {
  logger.info('mark all read triggered', { count: unreadCount.value }, CTX)
  markingAll.value = true
  try {
    await notifStore.markAllRead()
    logger.debug('all notifications marked as read', {}, CTX)
  } finally {
    markingAll.value = false
  }
}

function resolveRoute(n) {
  const d = n.data
  if (d?.orderId) return { name: 'user-order-detail', params: { id: d.orderId } }
  if (n.type === 'order_update') return { name: 'user-orders' }
  return null
}

function typeIconClass(type) {
  if (type === 'order_update') return 'nv__type-icon--order'
  if (type === 'promo')        return 'nv__type-icon--promo'
  return 'nv__type-icon--info'
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'همین الان'
  if (m < 60) return `${m} دقیقه پیش`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ساعت پیش`
  return `${Math.floor(h / 24)} روز پیش`
}
</script>

<style scoped>
/* ── Header ──────────────────────────────────────────────────── */
.nv__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.nv__title-wrap {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.nv__icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(var(--color-brand-rgb, 99 102 241), 0.1);
  border: 1px solid rgba(var(--color-brand-rgb, 99 102 241), 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nv__icon-svg {
  width: 22px;
  height: 22px;
  color: var(--color-brand);
}

.nv__title {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.nv__sub {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 3px 0 0;
}

.nv__mark-all {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  background: rgba(var(--color-brand-rgb, 99 102 241), 0.08);
  border: 1px solid rgba(var(--color-brand-rgb, 99 102 241), 0.2);
  color: var(--color-brand);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.nv__mark-all:hover:not(:disabled) {
  background: rgba(var(--color-brand-rgb, 99 102 241), 0.15);
}
.nv__mark-all:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── List ─────────────────────────────────────────────────────── */
.nv__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ── Item ─────────────────────────────────────────────────────── */
.nv__item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  text-align: right;
  width: 100%;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.15s;
}
.nv__item:hover {
  border-color: var(--color-brand);
  box-shadow: 0 2px 12px rgba(var(--color-brand-rgb, 99 102 241), 0.1);
}
.nv__item--unread {
  background-color: rgba(var(--color-brand-rgb, 99 102 241), 0.05);
  border-color: rgba(var(--color-brand-rgb, 99 102 241), 0.2);
}

/* ── Unread dot ───────────────────────────────────────────────── */
.nv__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}
.nv__dot--unread { background-color: var(--color-brand); }
.nv__dot--read   { background-color: transparent; }

/* ── Type icon ────────────────────────────────────────────────── */
.nv__type-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.nv__type-icon--order { background: rgba(59,130,246,0.12); color: #3b82f6; }
.nv__type-icon--promo { background: rgba(245,158,11,0.12); color: #f59e0b; }
.nv__type-icon--info  { background: rgba(99,102,241,0.12); color: #6366f1; }

/* ── Content ──────────────────────────────────────────────────── */
.nv__content {
  flex: 1;
  min-width: 0;
  text-align: right;
}

.nv__item-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.nv__item-body {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-top: 3px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nv__item-time {
  font-size: 0.7rem;
  color: var(--color-text-disabled, var(--color-text-secondary));
  margin-top: 6px;
}

/* ── Chevron ──────────────────────────────────────────────────── */
.nv__chevron {
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-top: 4px;
  opacity: 0.5;
  transition: opacity 0.15s;
}
.nv__item:hover .nv__chevron { opacity: 1; }

/* ── Skeleton ─────────────────────────────────────────────────── */
.nv__skeleton {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
}

.nv__skeleton-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
  margin-top: 6px;
  animation: pulse 1.5s ease-in-out infinite;
}

.nv__skeleton-body { flex: 1; }

.nv__skeleton-line {
  height: 0.875rem;
  border-radius: 6px;
  background: var(--color-border);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

/* ── Empty state ──────────────────────────────────────────────── */
.nv__empty {
  text-align: center;
  padding: 5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.nv__empty-icon { font-size: 3rem; }
.nv__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-top: 0.5rem;
}
.nv__empty-sub {
  font-size: 0.825rem;
  color: var(--color-text-secondary);
}

.nv__back-btn {
  margin-top: 1.25rem;
  padding: 0.6rem 1.5rem;
  border-radius: 10px;
  background: var(--color-brand);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}
.nv__back-btn:hover { opacity: 0.85; }
</style>
