import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/assets/styles/main.css'

// Apply saved theme before first render (avoid flash)
;(function () {
  const saved = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (saved === 'dark' || (!saved && prefersDark))
    document.documentElement.classList.add('dark')
})()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
