import { watchEffect } from 'vue'

function upsertMeta(attr, attrValue, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${attrValue}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertFavicon(url) {
  if (!url) return
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
}

/**
 * Reactively syncs site settings to <head> meta tags.
 * @param {import('vue').Ref} settings — reactive ref to settings object
 */
export function useSiteHead(settings) {
  watchEffect(() => {
    const s = settings.value
    if (!s) return

    if (s.siteName)    document.title = s.siteName
    upsertMeta('name',     'description',  s.description)
    upsertMeta('name',     'keywords',     s.keywords)
    upsertMeta('property', 'og:title',     s.siteName)
    upsertMeta('property', 'og:description', s.description)
    upsertMeta('property', 'og:image',     s.ogImage)
    upsertFavicon(s.faviconUrl)
  })
}
