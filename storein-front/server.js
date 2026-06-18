import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3000

// Railway: set API_INTERNAL_URL to the backend service URL, e.g.
//   https://storein-glasses-production.up.railway.app
const API_TARGET =
  process.env.API_INTERNAL_URL ||
  process.env.VITE_API_BASE_URL?.replace(/\/api(\/v\d+)?\/?$/, '') ||
  'http://localhost:3001'

console.log(`[storein-front] port=${PORT}  proxy-target=${API_TARGET}`)

if (!process.env.API_INTERNAL_URL && !process.env.VITE_API_BASE_URL) {
  console.warn('[storein-front] WARNING: API_INTERNAL_URL is not set — proxy will target localhost:3001')
}

// Shared error handler for both HTTP and WebSocket proxy errors.
// For WebSocket upgrades, `res` is a net.Socket (no writeHead/headersSent).
// Calling writeHead on a socket causes TypeError and corrupts the proxy state.
function makeProxyErrorHandler(label) {
  return function onError(err, req, res) {
    console.error(`[storein-front] ${label} proxy error: ${req.method ?? 'WS'} ${req.url} → ${err.message}`)
    if (typeof res.writeHead !== 'function') {
      // WebSocket upgrade failure — destroy the socket cleanly
      res.destroy()
      return
    }
    if (res.headersSent) return
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      statusCode: 502,
      message:    'پروکسی نتوانست به سرور متصل شود. لطفاً بعداً دوباره امتحان کنید.',
    }))
  }
}

// IMPORTANT: use pathFilter (NOT app.use('/api', proxy)).
// app.use('/api', proxy) strips the /api prefix before forwarding →
// backend sees /v1/products instead of /api/v1/products → 404.
app.use(createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: true,
  pathFilter:   '/api',
  on: { error: makeProxyErrorHandler('api') },
}))

const socketProxy = createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: true,
  pathFilter:   '/socket.io',
  ws:           true,
  on: { error: makeProxyErrorHandler('socket.io') },
})
app.use(socketProxy)

const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// Regex catch-all for Express 5 compatibility (app.get('*') syntax changed in v5)
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const server = app.listen(PORT, () => {
  console.log(`[storein-front] server ready on port ${PORT}`)
})

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket.io')) socketProxy.upgrade(req, socket, head)
})
