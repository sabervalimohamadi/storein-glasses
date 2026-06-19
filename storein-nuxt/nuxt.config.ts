export default defineNuxtConfig({
  devtools: { enabled: true },

  devServer: {
    port: 3005,
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
  ],

  // CSS is injected by @nuxtjs/tailwindcss via cssPath below (avoids duplicate @tailwind directives)

  runtimeConfig: {
    apiInternalUrl: process.env.API_INTERNAL_URL || 'http://localhost:3001',
    public: {
      siteUrl:    process.env.NUXT_PUBLIC_SITE_URL || 'https://storein.ir',
      apiBaseUrl: '/api/v1',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fa', dir: 'rtl' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'theme-color', content: '#863bff' },
        { name: 'application-name', content: 'استورین' },
      ],
      link: [
        { rel: 'icon',     href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  // Nitro: replaces Express proxy (server.js)
  nitro: {
    routeRules: {
      '/api/**':       { proxy: `${process.env.API_INTERNAL_URL || 'http://localhost:3001'}/api/**` },
      '/socket.io/**': { proxy: `${process.env.API_INTERNAL_URL || 'http://localhost:3001'}/socket.io/**` },
      '/uploads/**':   { proxy: `${process.env.API_INTERNAL_URL || 'http://localhost:3001'}/uploads/**` },
    },
  },

  // Hybrid rendering: SSR for public pages, CSR for private pages
  routeRules: {
    '/':            { swr: 60 },
    '/products':    { swr: 60 },
    '/category/**': { swr: 60 },
    '/product/**':  { swr: 300 },
    '/blog':        { swr: 300 },
    '/blog/**':     { swr: 3600 },
    '/pages/**':    { swr: 3600 },
    '/search':      { ssr: true },

    // Private pages — CSR only
    '/auth/**':    { ssr: false },
    '/cart':       { ssr: false },
    '/checkout':   { ssr: false },
    '/payment/**': { ssr: false },
    '/user/**':    { ssr: false },
  },

  tailwindcss: {
    configPath: '~/tailwind.config.js',
    cssPath: '~/assets/styles/main.css',
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  compatibilityDate: '2025-01-01',
})
