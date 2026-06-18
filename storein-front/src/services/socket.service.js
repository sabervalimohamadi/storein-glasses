import { io }     from 'socket.io-client'
import { logger } from '@/utils/logger'

const CTX = 'SocketService'

export function resolveSocketUrl() {
  // Explicit override wins — useful for debugging specific environments.
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL

  // Production: always connect to the frontend's own origin.
  // server.js proxies /socket.io → backend, so the WebSocket stays same-origin.
  // This avoids cross-origin WebSocket CORS rejection and Safari/Firefox cookie issues.
  if (import.meta.env.PROD) {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }

  // Local dev: connect directly to the running backend.
  const api = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'
  return api.replace(/\/api(\/v\d+)?\/?$/, '')
}

const SOCKET_URL = resolveSocketUrl() + '/notifications'

let socket = null

export const socketService = {
  connect(token) {
    if (socket?.connected) return socket

    logger.info('Socket connecting', { url: resolveSocketUrl() }, CTX)

    socket = io(SOCKET_URL, {
      auth:                 { token },
      transports:           ['websocket', 'polling'],
      reconnection:         true,
      reconnectionDelay:    2000,
      reconnectionAttempts: 10,
    })

    socket.on('connect',       ()      => logger.info('Socket connected',    { id: socket.id }, CTX))
    socket.on('disconnect',    reason  => logger.warn('Socket disconnected', { reason },        CTX))
    socket.on('connect_error', err     => logger.error('Socket error',       err, {},           CTX))

    return socket
  },

  on(event, handler)  { socket?.on(event, handler)  },
  off(event, handler) { socket?.off(event, handler) },

  disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
      logger.info('Socket disconnected by client', {}, CTX)
    }
  },

  isConnected() { return socket?.connected ?? false },

  _reset() { socket = null },
}
