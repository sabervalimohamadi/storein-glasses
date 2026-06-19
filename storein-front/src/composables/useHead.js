import { useHead } from '@unhead/vue'
import { watchEffect } from 'vue'

/**
 * Syncs global site settings (from CMS) to <head> once per app lifecycle.
 * Called once in App.vue; page-specific overrides come from useSeoHead.js.
 */
export function useSiteHead(settings, routeTitle) {
  watchEffect(() => {
    const s = settings.value
    if (!s) return

    // Update favicon dynamically when CMS overrides it
    if (s.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = s.faviconUrl
    }
  })

  useHead({
    titleTemplate: (title) => {
      const site = settings.value?.siteName ?? 'استورین'
      return title ? `${title} | ${site}` : site
    },
    meta: [
      { name: 'application-name', content: () => settings.value?.siteName ?? 'استورین' },
    ],
  })
}
