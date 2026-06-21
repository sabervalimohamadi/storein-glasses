import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock http ──────────────────────────────────────────────────────────────
vi.mock('./http.service', () => ({
  default: {
    get:   vi.fn(),
    patch: vi.fn(),
  },
}))

// ── Mock logger (suppress output in tests) ────────────────────────────────
vi.mock('@/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logger:  { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import http from './http.service'
import { wholesaleService } from './wholesale.service'

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.restoreAllMocks())

describe('wholesaleService.getPendingCount', () => {
  it('returns array length from backend', async () => {
    http.get.mockResolvedValue({ data: [{ _id: '1' }, { _id: '2' }, { _id: '3' }] })
    const count = await wholesaleService.getPendingCount()
    expect(count).toBe(3)
    expect(http.get).toHaveBeenCalledWith(
      '/admin/wholesale-requests',
      expect.objectContaining({ params: { status: 'pending' } })
    )
  })

  it('returns 0 when response is empty array', async () => {
    http.get.mockResolvedValue({ data: [] })
    expect(await wholesaleService.getPendingCount()).toBe(0)
  })

  it('returns 0 when network fails (non-critical)', async () => {
    http.get.mockRejectedValue(new Error('Network error'))
    expect(await wholesaleService.getPendingCount()).toBe(0)
  })

  it('returns 0 when data is not an array', async () => {
    http.get.mockResolvedValue({ data: null })
    expect(await wholesaleService.getPendingCount()).toBe(0)
  })
})

describe('wholesaleService.getRequests', () => {
  it('calls correct endpoint with status param', async () => {
    http.get.mockResolvedValue({ data: [] })
    await wholesaleService.getRequests('approved')
    expect(http.get).toHaveBeenCalledWith(
      '/admin/wholesale-requests',
      { params: { status: 'approved' } }
    )
  })

  it('defaults to pending', async () => {
    http.get.mockResolvedValue({ data: [] })
    await wholesaleService.getRequests()
    expect(http.get).toHaveBeenCalledWith(
      '/admin/wholesale-requests',
      { params: { status: 'pending' } }
    )
  })
})

describe('wholesaleService.handleRequest', () => {
  it('calls PATCH with userId, action, and reason', async () => {
    http.patch.mockResolvedValue({ data: {} })
    await wholesaleService.handleRequest('user123', 'approve', '')
    expect(http.patch).toHaveBeenCalledWith(
      '/admin/wholesale-requests/user123',
      { action: 'approve', reason: '' }
    )
  })

  it('calls PATCH with reject reason', async () => {
    http.patch.mockResolvedValue({ data: {} })
    await wholesaleService.handleRequest('user456', 'reject', 'اطلاعات کامل نیست')
    expect(http.patch).toHaveBeenCalledWith(
      '/admin/wholesale-requests/user456',
      { action: 'reject', reason: 'اطلاعات کامل نیست' }
    )
  })
})
