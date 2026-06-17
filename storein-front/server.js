import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Set API_INTERNAL_URL on Railway to the backend public URL:
//   https://storein-glasses-production.up.railway.app
const API_TARGET =
  process.env.API_INTERNAL_URL ||
  process.env.VITE_API_BASE_URL?.replace(/\/api(\/v\d+)?\/?$/, '') ||
  'http://localhost:3001'

console.log(`storein-front server starting on port ${PORT}`)
console.log(`Proxying /api + /socket.io → ${API_TARGET}`)

// IMPORTANT: use pathFilter (NOT app.use('/api', proxy))
// app.use('/api', proxy) strips the /api prefix before forwarding →
// backend receives /v1/products instead of /api/v1/products → 404
app.use(
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    pathFilter: '/api',
  }),
)

const socketProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  ws: true,
  pathFilter: '/socket.io',
})

app.use(socketProxy)

const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// Regex catch-all for Express 5 compatibility (app.get('*') syntax changed in v5)
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const server = app.listen(PORT, () => {
  console.log(`storein-front server ready on port ${PORT}`)
})

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket.io')) {
    socketProxy.upgrade(req, socket, head)
  }
})
