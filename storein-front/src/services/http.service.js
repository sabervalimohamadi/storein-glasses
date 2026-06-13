import axios    from 'axios'
import { logger } from '@/utils/logger'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// ── Token refresh state ───────────────────────────────────────────
let isRefreshing = false
let pendingQueue = []   // { resolve, reject }[]

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  pendingQueue = []
}

// ── Request interceptor ───────────────────────────────────────────
http.interceptors.request.use(
  (config) => {
    // Don't overwrite Authorization if the caller set it explicitly (e.g. refresh calls)
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('access_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    config.metadata = { startTime: Date.now() }
    return config
  },
  (error) => {
    logger.error('Request setup failed', error, {}, 'HTTP')
    return Promise.reject(error)
  },
)

// ── Response interceptor ──────────────────────────────────────────
http.interceptors.response.use(
  (response) => {
    // Unwrap backend envelope: { success, statusCode, data, timestamp } → data
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data
    }

    const duration = Date.now() - (response.config.metadata?.startTime ?? 0)
    if (duration > 3000) {
      logger.warn('Slow API call', {
        url:      response.config.url,
        method:   response.config.method?.toUpperCase(),
        duration: `${duration}ms`,
      }, 'Performance')
    }

    return response
  },
  async (error) => {
    const status   = error.response?.status
    const url      = error.config?.url ?? 'unknown'
    const method   = error.config?.method?.toUpperCase() ?? 'UNKNOWN'
    const message  = error.response?.data?.message ?? error.message
    const duration = Date.now() - (error.config?.metadata?.startTime ?? 0)

    logger.apiError(`${method} ${url}`, status ?? 0, message, { duration: `${duration}ms` })

    if (!error.response) {
      logger.error('Network error — no response from server', error, { url, method }, 'HTTP')
    }

    if (status === 401) {
      const originalRequest = error.config

      // Already retried or this IS the refresh request — hard logout
      if (originalRequest._retry || url.includes('/auth/refresh')) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth/login'
        return Promise.reject(error)
      }

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.removeItem('access_token')
        window.location.href = '/auth/login'
        return Promise.reject(error)
      }

      // Queue concurrent 401 requests while refresh is in flight
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return http(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await http.post(
          '/auth/refresh', {},
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        )
        const newToken = data.accessToken
        localStorage.setItem('access_token', newToken)
        if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return http(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default http
