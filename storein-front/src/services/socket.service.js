import { io }     from 'socket.io-client'
import { logger } from '@/utils/logger'

const CTX = 'SocketService'

export function resolveSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL
  // When VITE_API_BASE_URL is unset the proxy server handles /socket.io,
  // so an empty string tells Socket.IO to connect to the current origin.
  if (!import.meta.env.VITE_API_BASE_URL) return ''
  return import.meta.env.VITE_API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, '')
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
