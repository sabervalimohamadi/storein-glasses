import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const { mockGet, mockPush } = vi.hoisted(() => ({
  mockGet:  vi.fn(),
  mockPush: vi.fn(),
}))

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  RouterLink: { name: 'RouterLink', props: ['to'], template: '<a><slot /></a>' },
  useRoute: () => ({}),
}))

vi.mock('@/services/http.service', () => ({
  default: { get: mockGet },
}))

// Bypass debounce — call fn immediately
vi.mock('@vueuse/core', () => ({
  onClickOutside: vi.fn(),
  useDebounceFn:  (fn) => fn,
}))

import AppHeaderSearch from './AppHeaderSearch.vue'
import { logger } from '@/utils/logger'

const emptySuggest = { products: [], categories: [] }

function factory() {
  return mount(AppHeaderSearch, {
    attachTo: document.body,
    global: { stubs: { Transition: { template: '<div><slot /></div>' } } },
  })
}

describe('AppHeaderSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: emptySuggest })
  })

  // ── rendering ─────────────────────────────────────────────────
  it('renders the search input', () => {
    const wrapper = factory()
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('dropdown is hidden when query is empty', () => {
    const wrapper = factory()
    expect(wrapper.find('[class*="rounded-2xl"]').exists()).toBe(false)
  })

  // ── fetching suggestions ──────────────────────────────────────
  it('calls /search/suggest when query changes', async () => {
    const wrapper = factory()
    await wrapper.find('input').setValue('عینک')
    await flushPromises()
    expect(mockGet).toHaveBeenCalledWith('/search/suggest', { params: { q: 'عینک' } })
  })

  it('does not call API when query is whitespace only', async () => {
    const wrapper = factory()
    await wrapper.find('input').setValue('   ')
    await flushPromises()
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('logs info with counts after successful fetch', async () => {
    mockGet.mockResolvedValue({
      data: { products: [{ name: 'عینک آفتابی', slug: 'sunglasses' }], categories: [] },
    })
    const wrapper = factory()
    await wrapper.find('input').setValue('عینک')
    await flushPromises()
    expect(logger.info).toHaveBeenCalledWith(
      'search: suggestions fetched',
      expect.objectContaining({ q: 'عینک', products: 1, categories: 0 }),
      'AppHeaderSearch',
    )
  })

  it('logs error and clears suggestions on API failure', async () => {
    mockGet.mockRejectedValue(new Error('network error'))
    const wrapper = factory()
    await wrapper.find('input').setValue('عینک')
    await flushPromises()
    expect(logger.error).toHaveBeenCalledWith(
      'search: suggest request failed',
      expect.objectContaining({ q: 'عینک' }),
      'AppHeaderSearch',
    )
    expect(wrapper.vm.suggestions.products).toEqual([])
  })

  // ── products in dropdown ──────────────────────────────────────
  it('shows product name in dropdown', async () => {
    mockGet.mockResolvedValue({
      data: { products: [{ name: 'عینک ری‌بن', slug: 'rayban' }], categories: [] },
    })
    const wrapper = factory()
    await wrapper.find('input').trigger('focus')
    await wrapper.find('input').setValue('ری')
    await flushPromises()
    expect(wrapper.text()).toContain('عینک ری‌بن')
  })

  it('shows category name in dropdown', async () => {
    mockGet.mockResolvedValue({
      data: { products: [], categories: [{ name: 'عینک آفتابی', slug: 'sunglasses' }] },
    })
    const wrapper = factory()
    await wrapper.find('input').trigger('focus')
    await wrapper.find('input').setValue('آ')
    await flushPromises()
    expect(wrapper.text()).toContain('عینک آفتابی')
  })

  it('shows "no results" message when both arrays are empty', async () => {
    mockGet.mockResolvedValue({ data: emptySuggest })
    const wrapper = factory()
    await wrapper.find('input').trigger('focus')
    await wrapper.find('input').setValue('xyz_nomatch')
    await flushPromises()
    expect(wrapper.text()).toContain('نتیجه‌ای برای')
  })

  // ── navigation ────────────────────────────────────────────────
  it('navigates to product detail on product click', async () => {
    mockGet.mockResolvedValue({
      data: { products: [{ name: 'عینک ری‌بن', slug: 'rayban' }], categories: [] },
    })
    const wrapper = factory()
    await wrapper.find('input').trigger('focus')
    await wrapper.find('input').setValue('ری')
    await flushPromises()

    const btns = wrapper.findAll('button').filter(b => b.text() === 'عینک ری‌بن')
    await btns[0].trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'product-detail', params: { slug: 'rayban' } })
  })

  it('navigates to category page on category click', async () => {
    mockGet.mockResolvedValue({
      data: { products: [], categories: [{ name: 'عینک آفتابی', slug: 'sunglasses' }] },
    })
    const wrapper = factory()
    await wrapper.find('input').trigger('focus')
    await wrapper.find('input').setValue('آ')
    await flushPromises()

    const btns = wrapper.findAll('button').filter(b => b.text().includes('عینک آفتابی'))
    await btns[0].trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'category', params: { slug: 'sunglasses' } })
  })

  it('navigates to search results page on Enter key', async () => {
    const wrapper = factory()
    await wrapper.find('input').setValue('عینک')
    await wrapper.find('input').trigger('keydown.enter')
    expect(mockPush).toHaveBeenCalledWith({ name: 'search', query: { q: 'عینک' } })
  })

  it('does not navigate on Enter when query is empty', async () => {
    const wrapper = factory()
    await wrapper.find('input').setValue('')
    await wrapper.find('input').trigger('keydown.enter')
    expect(mockPush).not.toHaveBeenCalled()
  })

  // ── focus / blur ──────────────────────────────────────────────
  it('opens dropdown on focus', async () => {
    const wrapper = factory()
    await wrapper.find('input').trigger('focus')
    expect(wrapper.vm.isOpen).toBe(true)
  })

  it('closes dropdown on Esc key', async () => {
    const wrapper = factory()
    await wrapper.find('input').trigger('focus')
    await wrapper.find('input').trigger('keydown.esc')
    expect(wrapper.vm.isOpen).toBe(false)
  })
})
