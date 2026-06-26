import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterMobileDrawer from './FilterMobileDrawer.vue'

vi.mock('~/stores/category.store', () => ({
  useCategoryStore: () => ({
    categories: [
      { _id: 'cat1', name: 'عینک آفتابی',   slug: 'sunglasses', depth: 0 },
      { _id: 'cat2', name: 'عینک طبی',      slug: 'optical',    depth: 0 },
      { _id: 'cat3', name: 'زیر-دسته-عمیق', slug: 'sub-deep',   depth: 1 },
    ],
  }),
}))

vi.mock('~/utils/constants', () => ({
  GENDER_OPTIONS: [
    { label: 'مردانه', value: 'male' },
    { label: 'زنانه',  value: 'female' },
  ],
  FRAME_SHAPES: [
    { label: 'گرد',     value: 'round'  },
    { label: 'مربعی',   value: 'square' },
    { label: 'بیضی',    value: 'oval'   },
  ],
  FRAME_MATERIALS: [
    { label: 'استیل',   value: 'steel'   },
    { label: 'استات',   value: 'acetate' },
  ],
}))

vi.mock('~/utils/formatters', () => ({
  formatNumber: (n) => String(n),
}))

const defaultFilters = () => ({
  category: '', brand: null, genders: [], frameShapes: [], frameMaterials: [],
  minPrice: null, maxPrice: null, inStock: false,
})

function mountDrawer(open = true) {
  return mount(FilterMobileDrawer, {
    props:   { modelValue: open, filters: defaultFilters() },
    global: { stubs: { Teleport: true, Transition: true } },
  })
}

describe('FilterMobileDrawer', () => {

  describe('rootCategories computed', () => {
    it('exposes only depth-0 categories in category section', async () => {
      const w = mountDrawer()
      const texts = w.findAll('button').map(b => b.text())
      expect(texts).toContain('عینک آفتابی')
      expect(texts).toContain('عینک طبی')
      expect(texts).not.toContain('زیر-دسته-عمیق') // depth 1 — excluded
    })
  })

  describe('frame shape filter', () => {
    it('toggles a frame shape into localFilters', async () => {
      const w = mountDrawer()
      const roundBtn = w.findAll('button').find(b => b.text() === 'گرد')
      await roundBtn.trigger('click')
      // Click "نمایش نتایج"
      const applyBtn = w.findAll('button').find(b => b.text() === 'نمایش نتایج')
      await applyBtn.trigger('click')
      const emitted = w.emitted('apply')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0].frameShapes).toEqual(['round'])
    })

    it('emits multiple frame shapes when multiple selected', async () => {
      const w = mountDrawer()
      for (const label of ['گرد', 'مربعی']) {
        const btn = w.findAll('button').find(b => b.text() === label)
        await btn.trigger('click')
      }
      const applyBtn = w.findAll('button').find(b => b.text() === 'نمایش نتایج')
      await applyBtn.trigger('click')
      expect(w.emitted('apply')[0][0].frameShapes).toEqual(expect.arrayContaining(['round', 'square']))
    })

    it('deselects a frame shape on second click', async () => {
      const w = mountDrawer()
      const roundBtn = () => w.findAll('button').find(b => b.text() === 'گرد')
      await roundBtn().trigger('click')
      await roundBtn().trigger('click')
      const applyBtn = w.findAll('button').find(b => b.text() === 'نمایش نتایج')
      await applyBtn.trigger('click')
      expect(w.emitted('apply')[0][0].frameShapes).toEqual([])
    })
  })

  describe('frame material filter', () => {
    it('toggles a frame material into localFilters', async () => {
      const w = mountDrawer()
      const steelBtn = w.findAll('button').find(b => b.text() === 'استیل')
      await steelBtn.trigger('click')
      const applyBtn = w.findAll('button').find(b => b.text() === 'نمایش نتایج')
      await applyBtn.trigger('click')
      expect(w.emitted('apply')[0][0].frameMaterials).toEqual(['steel'])
    })
  })

  describe('applyAndClose', () => {
    it('emits apply with full filter object including arrays', async () => {
      const w = mountDrawer()
      const applyBtn = w.findAll('button').find(b => b.text() === 'نمایش نتایج')
      await applyBtn.trigger('click')
      const payload = w.emitted('apply')[0][0]
      expect(payload).toMatchObject({
        genders:        expect.any(Array),
        frameShapes:    expect.any(Array),
        frameMaterials: expect.any(Array),
      })
    })

    it('emits update:modelValue false to close the drawer', async () => {
      const w = mountDrawer()
      const applyBtn = w.findAll('button').find(b => b.text() === 'نمایش نتایج')
      await applyBtn.trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([false])
    })
  })

  describe('clearAndClose', () => {
    it('emits clear event', async () => {
      const w = mountDrawer()
      const clearBtn = w.findAll('button').find(b => b.text() === 'حذف فیلترها')
      await clearBtn.trigger('click')
      expect(w.emitted('clear')).toBeTruthy()
    })
  })
})
