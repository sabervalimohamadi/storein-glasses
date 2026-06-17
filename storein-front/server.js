import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Railway private networking: services in the same project communicate via
// <service-name>.railway.internal without leaving Railway's internal network.
// Set API_INTERNAL_URL on the Railway storein-front service, e.g.:
//   http://storein.railway.internal:3000
// For local preview testing, fall back to the explicit public URL or localhost.
const API_TARGET =
  process.env.API_INTERNAL_URL ||
  process.env.VITE_API_BASE_URL?.replace(/\/api(\/v\d+)?\/?$/, '') ||
  'http://localhost:3001'

console.log(`storein-front server starting on port ${PORT}`)
console.log(`Proxying /api + /socket.io → ${API_TARGET}`)

// Proxy all /api/* requests — browser sees them as same-origin (first-party cookie)
app.use(
  '/api',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
  }),
)

// Proxy Socket.IO WebSocket connections for real-time notifications
app.use(
  '/socket.io',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    ws: true,
  }),
)

// Serve the Vite-built SPA
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// SPA fallback — Vue Router handles all non-API client-side routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`storein-front server ready on port ${PORT}`)
})
