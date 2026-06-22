import http   from './http.service'
import logger from '@/utils/logger'

const CTX = 'WholesaleService'

export const wholesaleService = {
  /**
   * Fetch wholesale requests filtered by status.
   */
  async getRequests(status = 'pending') {
    logger.debug('getRequests', { status }, CTX)
    return http.get('/admin/wholesale-requests', { params: { status } })
  },

  /**
   * Returns the count of pending wholesale requests.
   * Used for the real-time dashboard badge.
   */
  async getPendingCount() {
    logger.debug('getPendingCount: fetching', {}, CTX)
    try {
      const res     = await http.get('/admin/wholesale-requests', {
        params:        { status: 'pending' },
        skipErrorLog:  true,
      })
      const list  = Array.isArray(res.data) ? res.data : []
      const count = list.length
      logger.info('getPendingCount: resolved', { count }, CTX)
      return count
    } catch (err) {
      logger.warn('getPendingCount: request failed', { error: err?.message }, CTX)
      return 0
    }
  },

  /**
   * Approve or reject a wholesale request.
   */
  async handleRequest(userId, action, reason = '') {
    logger.info('handleRequest', { userId, action }, CTX)
    return http.patch(`/admin/wholesale-requests/${userId}`, { action, reason })
  },

  /**
   * Fetch paginated wholesale orders (orders placed by wholesale users).
   */
  async getWholesaleOrders({ page = 1, limit = 20, status } = {}) {
    logger.debug('getWholesaleOrders', { page, limit, status }, CTX)
    return http.get('/admin/wholesale-orders', { params: { page, limit, status } })
  },

  /**
   * Count of pending wholesale orders — used for badge.
   */
  async getWholesaleOrdersCount(status = 'pending') {
    logger.debug('getWholesaleOrdersCount', { status }, CTX)
    try {
      const res = await http.get('/admin/wholesale-orders/count', {
        params: { status },
        skipErrorLog: true,
      })
      return typeof res.data === 'number' ? res.data : 0
    } catch {
      return 0
    }
  },
}
