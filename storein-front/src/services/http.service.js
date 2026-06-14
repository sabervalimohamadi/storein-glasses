import axios    from 'axios'
import { logger } from '@/utils/logger'

const http = axios.create({
  baseURL:         import.meta.env.VITE_API_BASE_URL,
  timeout:         15000,
  withCredentials: true,   // sends HttpOnly refresh_token cookie on every request
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// ── Lazy token accessor — avoids circular import with auth.store ──────────
// auth.store calls setTokenProvider(() => token.value) on store creation.
let _getToken = () => null
export function setTokenProvider(fn) { _getToken = fn }

// ── Token refresh state ───────────────────────────────────────────────────
let isRefreshing = false
let pendingQueue = []

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  pendingQueue = []
}

// ── Request interceptor ───────────────────────────────────────────────────
http.interceptors.request.use(
  (config) => {
    const token = _getToken()
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.metadata = { startTime: Date.now() }
    return config
  },
  (error) => {
    logger.error('Request setup failed', error, {}, 'HTTP')
    return Promise.reject(error)
  },
)

// ── Response interceptor ──────────────────────────────────────────────────
http.interceptors.response.use(
  (response) => {
    // Unwrap backend envelope: { success, statusCode, data, timestamp } → data
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
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
    const status  = error.response?.status
    const url     = error.config?.url ?? 'unknown'
    const method  = error.config?.method?.toUpperCase() ?? 'UNKNOWN'
    const message = error.response?.data?.message ?? error.message

    if (!error.config?.skipErrorLog) {
      logger.apiError(`${method} ${url}`, status ?? 0, message)
      if (!error.response) {
        logger.error('Network error — no response', error, { url, method }, 'HTTP')
      }
    }

    if (status === 401) {
      const originalRequest = error.config

      // The refresh endpoint itself returned 401 — no valid cookie/session.
      // Do NOT redirect here: initAuth()'s catch block handles this gracefully.
      if (url.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      // Already retried once and still 401 — session is dead, hard logout
      if (originalRequest._retry) {
        _getToken = () => null
        window.location.href = '/auth/login'
        return Promise.reject(error)
      }

      // Queue concurrent 401s while refresh is in flight
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then(newToken => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return http(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // withCredentials:true sends the HttpOnly cookie — no Authorization header needed
        const { data } = await http.post('/auth/refresh', {}, { skipErrorLog: true })
        const newToken = data.accessToken

        const { useAuthStore } = await import('@/stores/auth.store')
        const auth = useAuthStore()
        auth.token = newToken

        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return http(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        const { useAuthStore } = await import('@/stores/auth.store')
        const auth = useAuthStore()
        auth.token = null
        auth.user  = null
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
