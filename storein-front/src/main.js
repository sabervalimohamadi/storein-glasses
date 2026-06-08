import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import App    from './App.vue'
import router from './router'
import { logger } from '@/utils/logger'
import '@/assets/styles/main.css'

// Apply saved theme before first render (avoid flash)
;(function () {
  const saved = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (saved === 'dark' || (!saved && prefersDark))
    document.documentElement.classList.add('dark')
})()

const app = createApp(App)

// Vue component error handler
app.config.errorHandler = (error, componentInstance, info) => {
  logger.error(
    'Vue Component Error',
    error,
    {
      info,
      component: componentInstance?.$options?.name
               ?? componentInstance?.__name
               ?? 'Unknown',
    },
    'Vue',
  )
}

// Vue warning handler (dev only)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, componentInstance, trace) => {
    logger.warn('Vue Warning', { msg, trace }, 'Vue')
  }
}

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error(
    'Unhandled Promise Rejection',
    event.reason,
    { promise: String(event.promise) },
    'GlobalHandler',
  )
})

// Global JS errors outside Vue
window.addEventListener('error', (event) => {
  logger.error(
    'Global JavaScript Error',
    event.error,
    { filename: event.filename, lineno: event.lineno, colno: event.colno },
    'GlobalHandler',
  )
})

// Router navigation errors
router.onError((error) => {
  logger.error('Router Navigation Error', error, {
    from: router.currentRoute.value?.fullPath,
  }, 'Router')
})

app.use(createPinia())
app.use(router)
app.mount('#app')

logger.info('storein-front started', {
  version: import.meta.env.VITE_APP_VERSION,
  env:     import.meta.env.MODE,
}, 'Bootstrap')
