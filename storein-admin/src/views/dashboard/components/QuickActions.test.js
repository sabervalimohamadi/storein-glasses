import { describe, it, expect } from 'vitest'
import { mount }               from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import QuickActions            from './QuickActions.vue'

function buildRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/',                   component: { template: '<div/>' } },
      { path: '/products/create',    name: 'product-create',      component: { template: '<div/>' } },
      { path: '/orders',             name: 'orders',              component: { template: '<div/>' } },
      { path: '/reviews',            name: 'reviews',             component: { template: '<div/>' } },
      { path: '/wholesale',          name: 'wholesale-requests',  component: { template: '<div/>' } },
      { path: '/categories',         name: 'categories',          component: { template: '<div/>' } },
    ],
  })
}

function mountComp(props = {}) {
  return mount(QuickActions, {
    props,
    global: { plugins: [buildRouter()] },
  })
}

describe('QuickActions', () => {
  it('renders 5 quick-action cards', async () => {
    const wrapper = mountComp()
    await wrapper.vm.$router.isReady()
    const links = wrapper.findAll('a')
    expect(links.length).toBe(5)
  })

  it('shows wholesale card with correct label', async () => {
    const wrapper = mountComp()
    await wrapper.vm.$router.isReady()
    expect(wrapper.text()).toContain('درخواست‌های عمده')
  })

  it('shows no badge when pendingWholesale is 0', async () => {
    const wrapper = mountComp({ pendingWholesale: 0 })
    await wrapper.vm.$router.isReady()
    const badges = wrapper.findAll('[class*="bg-amber"]')
    expect(badges.length).toBe(0)
  })

  it('shows amber badge with count when pendingWholesale > 0', async () => {
    const wrapper = mountComp({ pendingWholesale: 5 })
    await wrapper.vm.$router.isReady()
    const badge = wrapper.find('span[class*="bg-amber-5"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
  })

  it('caps badge display at 99+', async () => {
    const wrapper = mountComp({ pendingWholesale: 150 })
    await wrapper.vm.$router.isReady()
    const badge = wrapper.find('span[class*="bg-amber-5"]')
    expect(badge.text()).toBe('99+')
  })

  it('shows error badge for pending orders', async () => {
    const wrapper = mountComp({ pendingOrders: 3 })
    await wrapper.vm.$router.isReady()
    const badges = wrapper.findAll('[class*="bg-error"]')
    expect(badges.length).toBeGreaterThan(0)
    expect(badges[0].text()).toBe('3')
  })

  it('adds highlight styling when pendingWholesale > 0', async () => {
    const wrapper = mountComp({ pendingWholesale: 2 })
    await wrapper.vm.$router.isReady()
    const links = wrapper.findAll('a')
    const wholesaleLink = links.find(l => l.text().includes('درخواست‌های عمده'))
    expect(wholesaleLink?.classes().join(' ')).toContain('amber')
  })

  it('wholesale card links to wholesale-requests route', async () => {
    const wrapper = mountComp()
    await wrapper.vm.$router.isReady()
    const links = wrapper.findAll('a')
    const wholesaleLink = links.find(l => l.text().includes('درخواست‌های عمده'))
    expect(wholesaleLink?.attributes('href')).toBe('/wholesale')
  })
})
