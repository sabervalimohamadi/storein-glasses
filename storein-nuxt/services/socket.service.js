import { io } from 'socket.io-client'

function resolveSocketUrl() {
  // Production: connect to same origin — Nuxt Nitro proxies /socket.io → backend
  if (process.env.NODE_ENV === 'production') {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }
  // Local dev: connect directly to the running backend
  return 'http://localhost:3000'
}

const SOCKET_NAMESPACE = resolveSocketUrl() + '/notifications'

let socket = null

export const socketService = {
  connect(token) {
    if (socket?.connected) return socket

    socket = io(SOCKET_NAMESPACE, {
      auth:                 { token },
      transports:           ['websocket', 'polling'],
      reconnection:         true,
      reconnectionDelay:    2000,
      reconnectionAttempts: 10,
    })

    socket.on('connect',       ()     => console.info('[Socket] connected', socket.id))
    socket.on('disconnect',    reason => console.warn('[Socket] disconnected', reason))
    socket.on('connect_error', err    => console.error('[Socket] error', err.message))

    return socket
  },

  on(event, handler)  { socket?.on(event, handler)  },
  off(event, handler) { socket?.off(event, handler) },

  disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  },

  isConnected() { return socket?.connected ?? false },
}
