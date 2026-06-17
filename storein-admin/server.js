import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 4000

// Railway: set API_INTERNAL_URL to the backend service URL, e.g.
//   https://storein-glasses-production.up.railway.app
const API_TARGET =
  process.env.API_INTERNAL_URL ||
  process.env.VITE_API_BASE_URL?.replace(/\/api(\/v\d+)?\/?$/, '') ||
  'http://localhost:3001'

console.log(`[storein-admin] port=${PORT}  proxy-target=${API_TARGET}`)

if (!process.env.API_INTERNAL_URL && !process.env.VITE_API_BASE_URL) {
  console.warn('[storein-admin] WARNING: API_INTERNAL_URL is not set — proxy will target localhost:3001')
}

// IMPORTANT: use pathFilter (NOT app.use('/api', proxy)).
// app.use('/api', proxy) strips the /api prefix before forwarding →
// backend sees /v1/auth/change-password instead of /api/v1/auth/change-password → 404.
const apiProxy = createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: true,
  pathFilter:   '/api',
  on: {
    error(err, req, res) {
      console.error(`[storein-admin] proxy error: ${req.method} ${req.url} → ${err.message}`)
      if (res.headersSent) return
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        statusCode: 502,
        message:    'پروکسی نتوانست به سرور متصل شود. لطفاً بعداً دوباره امتحان کنید.',
      }))
    },
  },
})

app.use(apiProxy)

const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// Regex catch-all for Express 5 compatibility (app.get('*') syntax changed in v5)
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`[storein-admin] server ready on port ${PORT}`)
})
