import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/stores/notification.store', () => ({
  useNotificationStore: vi.fn(),
}))

import { useNotificationStore } from '@/stores/notification.store'
import { logger } from '@/utils/logger'
import NotificationsView from './NotificationsView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/',                        name: 'home',              component: { template: '<div/>' } },
    { path: '/user/notifications',      name: 'user-notifications',component: NotificationsView },
    { path: '/user/orders',             name: 'user-orders',       component: { template: '<div/>' } },
    { path: '/user/orders/:id',         name: 'user-order-detail', component: { template: '<div/>' } },
  ],
})

const makeNotif = (overrides = {}) => ({
  _id:       'n1',
  type:      'order_update',
  title:     'سفارش تایید شد',
  body:      'سفارش شما پردازش می‌شود',
  data:      { orderId: 'o123' },
  isRead:    false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

// Plain object mock — no storeToRefs in component so plain values are fine
function makeStore(overrides = {}) {
  return {
    notifications:     [],
    loading:           false,
    unreadCount:       0,
    fetched:           false,
    fetchNotifications: vi.fn().mockResolvedValue(undefined),
    markRead:          vi.fn().mockResolvedValue(undefined),
    markAllRead:       vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function mountView(store) {
  useNotificationStore.mockReturnValue(store)
  return mount(NotificationsView, {
    global: {
      plugins: [createPinia(), router],
      stubs:   { RouterLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('NotificationsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── mount / fetch ──────────────────────────────────────────────
  describe('on mount', () => {
    it('calls fetchNotifications when not yet fetched', async () => {
      const store = makeStore({ fetched: false })
      mountView(store)
      await flushPromises()
      expect(store.fetchNotifications).toHaveBeenCalledTimes(1)
    })

    it('skips fetchNotifications when already fetched', async () => {
      const store = makeStore({ fetched: true })
      mountView(store)
      await flushPromises()
      expect(store.fetchNotifications).not.toHaveBeenCalled()
    })

    it('logs info on mount', async () => {
      mountView(makeStore())
      await flushPromises()
      expect(logger.info).toHaveBeenCalledWith(
        'notifications page mounted', {}, 'NotificationsView',
      )
    })
  })

  // ── loading state ──────────────────────────────────────────────
  describe('loading state', () => {
    it('renders skeleton items while loading', () => {
      const wrapper = mountView(makeStore({ loading: true }))
      expect(wrapper.findAll('.nv__skeleton').length).toBeGreaterThan(0)
    })

    it('does not render skeleton after loading', () => {
      const wrapper = mountView(makeStore({ loading: false, notifications: [makeNotif()] }))
      expect(wrapper.findAll('.nv__skeleton')).toHaveLength(0)
    })
  })

  // ── empty state ────────────────────────────────────────────────
  describe('empty state', () => {
    it('shows empty section when no notifications', () => {
      const wrapper = mountView(makeStore({ loading: false, notifications: [] }))
      expect(wrapper.find('.nv__empty').exists()).toBe(true)
    })

    it('hides empty section when there are notifications', () => {
      const wrapper = mountView(makeStore({ loading: false, notifications: [makeNotif()] }))
      expect(wrapper.find('.nv__empty').exists()).toBe(false)
    })

    it('shows title text in empty state', () => {
      const wrapper = mountView(makeStore({ loading: false, notifications: [] }))
      expect(wrapper.find('.nv__empty-title').text()).toContain('هیچ اعلانی وجود ندارد')
    })
  })

  // ── notification list ──────────────────────────────────────────
  describe('notification items', () => {
    it('renders one item per notification', () => {
      const store = makeStore({
        notifications: [makeNotif({ _id: 'n1' }), makeNotif({ _id: 'n2', isRead: true })],
      })
      const wrapper = mountView(store)
      expect(wrapper.findAll('.nv__item')).toHaveLength(2)
    })

    it('applies nv__item--unread class to unread items', () => {
      const wrapper = mountView(makeStore({ notifications: [makeNotif({ isRead: false })] }))
      expect(wrapper.find('.nv__item').classes()).toContain('nv__item--unread')
    })

    it('does not apply nv__item--unread class to read items', () => {
      const wrapper = mountView(makeStore({ notifications: [makeNotif({ isRead: true })] }))
      expect(wrapper.find('.nv__item').classes()).not.toContain('nv__item--unread')
    })

    it('renders item title and body', () => {
      const wrapper = mountView(makeStore({
        notifications: [makeNotif({ title: 'عنوان تست', body: 'متن تست' })],
      }))
      expect(wrapper.find('.nv__item-title').text()).toBe('عنوان تست')
      expect(wrapper.find('.nv__item-body').text()).toBe('متن تست')
    })
  })

  // ── phosphor green ── unread visual cues ──────────────────────
  describe('phosphor green indicators for unread', () => {
    it('unread dot has nv__dot--unread class', () => {
      const wrapper = mountView(makeStore({ notifications: [makeNotif({ isRead: false })] }))
      expect(wrapper.find('.nv__dot').classes()).toContain('nv__dot--unread')
    })

    it('read dot has nv__dot--read class', () => {
      const wrapper = mountView(makeStore({ notifications: [makeNotif({ isRead: true })] }))
      expect(wrapper.find('.nv__dot').classes()).toContain('nv__dot--read')
    })

    it('unread item title has nv__item-title--unread class', () => {
      const wrapper = mountView(makeStore({ notifications: [makeNotif({ isRead: false })] }))
      expect(wrapper.find('.nv__item-title').classes()).toContain('nv__item-title--unread')
    })

    it('read item title does not have nv__item-title--unread class', () => {
      const wrapper = mountView(makeStore({ notifications: [makeNotif({ isRead: true })] }))
      expect(wrapper.find('.nv__item-title').classes()).not.toContain('nv__item-title--unread')
    })

    it('badge appears on bell when unreadCount > 0', () => {
      const wrapper = mountView(makeStore({ unreadCount: 3 }))
      expect(wrapper.find('[data-testid="unread-badge"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="unread-badge"]').text()).toBe('3')
    })

    it('badge is hidden when unreadCount is 0', () => {
      const wrapper = mountView(makeStore({ unreadCount: 0 }))
      expect(wrapper.find('[data-testid="unread-badge"]').exists()).toBe(false)
    })

    it('header sub text uses phosphor class when unread items exist', () => {
      const wrapper = mountView(makeStore({ unreadCount: 2 }))
      expect(wrapper.find('.nv__sub--phosphor').exists()).toBe(true)
      expect(wrapper.find('.nv__sub--phosphor').text()).toContain('2')
    })

    it('header sub falls back to all-read message when count is 0', () => {
      const wrapper = mountView(makeStore({ unreadCount: 0 }))
      expect(wrapper.find('.nv__sub--phosphor').exists()).toBe(false)
      expect(wrapper.find('.nv__sub').text()).toContain('همه اعلان‌ها خوانده شده‌اند')
    })
  })

  // ── click handling ─────────────────────────────────────────────
  describe('clicking a notification', () => {
    it('calls markRead for an unread notification', async () => {
      const n     = makeNotif({ _id: 'n1', isRead: false })
      const store = makeStore({ notifications: [n] })
      const wrapper = mountView(store)
      await wrapper.find('.nv__item').trigger('click')
      await flushPromises()
      expect(store.markRead).toHaveBeenCalledWith('n1')
    })

    it('does not call markRead for a read notification', async () => {
      const n     = makeNotif({ _id: 'n1', isRead: true })
      const store = makeStore({ notifications: [n] })
      const wrapper = mountView(store)
      await wrapper.find('.nv__item').trigger('click')
      await flushPromises()
      expect(store.markRead).not.toHaveBeenCalled()
    })

    it('logs debug when clicking a notification', async () => {
      const n = makeNotif({ _id: 'n1' })
      mountView(makeStore({ notifications: [n] }))
        .find('.nv__item').trigger('click')
      await flushPromises()
      expect(logger.debug).toHaveBeenCalledWith(
        'notification item clicked',
        expect.objectContaining({ id: 'n1' }),
        'NotificationsView',
      )
    })
  })

  // ── mark all read button ───────────────────────────────────────
  describe('mark all read button', () => {
    it('is visible when unreadCount > 0', () => {
      const wrapper = mountView(makeStore({ unreadCount: 3 }))
      expect(wrapper.find('.nv__mark-all').exists()).toBe(true)
    })

    it('is hidden when unreadCount is 0', () => {
      const wrapper = mountView(makeStore({ unreadCount: 0 }))
      expect(wrapper.find('.nv__mark-all').exists()).toBe(false)
    })

    it('calls markAllRead on click', async () => {
      const store = makeStore({ unreadCount: 2 })
      const wrapper = mountView(store)
      await wrapper.find('.nv__mark-all').trigger('click')
      await flushPromises()
      expect(store.markAllRead).toHaveBeenCalledTimes(1)
    })

    it('logs info when mark all is triggered', async () => {
      const store = makeStore({ unreadCount: 4 })
      const wrapper = mountView(store)
      await wrapper.find('.nv__mark-all').trigger('click')
      await flushPromises()
      expect(logger.info).toHaveBeenCalledWith(
        'mark all read triggered', { count: 4 }, 'NotificationsView',
      )
    })
  })

  // ── header subtitle ────────────────────────────────────────────
  describe('unread count in header', () => {
    it('shows unread count when > 0', () => {
      const wrapper = mountView(makeStore({ unreadCount: 5 }))
      expect(wrapper.find('.nv__sub').text()).toContain('5')
    })

    it('shows all-read message when count is 0', () => {
      const wrapper = mountView(makeStore({ unreadCount: 0 }))
      expect(wrapper.find('.nv__sub').text()).toContain('همه اعلان‌ها خوانده شده‌اند')
    })
  })
})
