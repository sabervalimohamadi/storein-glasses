import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/services/frame-attribute.service', () => ({
  frameAttributeService: { getActive: vi.fn() },
}))
vi.mock('~/utils/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { useFrameAttributeStore } from './frame-attribute.store'
import { frameAttributeService } from '~/services/frame-attribute.service'
import { logger } from '~/utils/logger'

const SHAPES = [
  { label: 'گرد',       value: 'round'     },
  { label: 'مربعی',     value: 'square'    },
  { label: 'پروانه‌ای', value: 'butterfly' },
]
const MATERIALS = [
  { label: 'استیل',   value: 'steel'   },
  { label: 'استات',   value: 'acetate' },
]

describe('useFrameAttributeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty arrays and loaded=false', () => {
    const store = useFrameAttributeStore()
    expect(store.frameShapes).toEqual([])
    expect(store.frameMaterials).toEqual([])
    expect(store.loaded).toBe(false)
    expect(store.loading).toBe(false)
  })

  it('fetches both frameShape and frameMaterial types', async () => {
    frameAttributeService.getActive.mockResolvedValue({ data: [] })
    const store = useFrameAttributeStore()
    await store.fetch()
    expect(frameAttributeService.getActive).toHaveBeenCalledWith('frameShape')
    expect(frameAttributeService.getActive).toHaveBeenCalledWith('frameMaterial')
  })

  it('stores fetched shapes and materials', async () => {
    frameAttributeService.getActive
      .mockResolvedValueOnce({ data: SHAPES })
      .mockResolvedValueOnce({ data: MATERIALS })
    const store = useFrameAttributeStore()
    await store.fetch()
    expect(store.frameShapes).toEqual(SHAPES)
    expect(store.frameMaterials).toEqual(MATERIALS)
    expect(store.loaded).toBe(true)
  })

  it('a newly added shape appears in frameShapes after fetch', async () => {
    frameAttributeService.getActive
      .mockResolvedValueOnce({ data: SHAPES })
      .mockResolvedValueOnce({ data: MATERIALS })
    const store = useFrameAttributeStore()
    await store.fetch()
    expect(store.frameShapes.find(s => s.value === 'butterfly')).toBeTruthy()
  })

  it('does not refetch if already loaded', async () => {
    frameAttributeService.getActive.mockResolvedValue({ data: [] })
    const store = useFrameAttributeStore()
    await store.fetch()
    await store.fetch()
    expect(frameAttributeService.getActive).toHaveBeenCalledTimes(2) // 2 calls per fetch, only 1 fetch
  })

  it('logs debug on successful load', async () => {
    frameAttributeService.getActive.mockResolvedValue({ data: SHAPES })
    const store = useFrameAttributeStore()
    await store.fetch()
    expect(logger.debug).toHaveBeenCalledWith(
      'Frame attributes loaded',
      expect.objectContaining({ shapes: SHAPES.length }),
      'FrameAttributeStore',
    )
  })

  it('handles API error gracefully — does not throw, stays unloaded', async () => {
    frameAttributeService.getActive.mockRejectedValue(new Error('Network error'))
    const store = useFrameAttributeStore()
    await expect(store.fetch()).resolves.toBeUndefined()
    expect(store.loaded).toBe(false)
    expect(store.loading).toBe(false)
    expect(logger.error).toHaveBeenCalled()
  })

  it('sets loading=true during fetch and false after', async () => {
    let resolveShapes
    frameAttributeService.getActive
      .mockReturnValueOnce(new Promise(r => { resolveShapes = r }))
      .mockResolvedValueOnce({ data: [] })
    const store = useFrameAttributeStore()
    const promise = store.fetch()
    expect(store.loading).toBe(true)
    resolveShapes({ data: [] })
    await promise
    expect(store.loading).toBe(false)
  })
})
