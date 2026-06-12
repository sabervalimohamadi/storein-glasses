import { io } from 'socket.io-client'

let socket = null

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000') + '/notifications'

export const socketService = {
  connect(token) {
    if (socket?.connected) return socket

    socket = io(SOCKET_URL, {
      auth:      { token },
      transports: ['websocket', 'polling'],
      reconnection:        true,
      reconnectionDelay:   2000,
      reconnectionAttempts: 10,
    })

    socket.on('connect', () => {
      console.info('[Socket] Connected to admin channel ✅')
    })

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
    })

    return socket
  },

  on(event, handler) {
    socket?.on(event, handler)
  },

  off(event, handler) {
    socket?.off(event, handler)
  },

  disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  },

  isConnected() {
    return socket?.connected ?? false
  },
}
