import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    allowedHosts: 'all',
    proxy: {
      '/api/v1/': { target: 'http://localhost:3000', changeOrigin: true },
      // Forward /uploads/* to the backend so <img src="/uploads/..."> works in dev.
      '/uploads':  { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
