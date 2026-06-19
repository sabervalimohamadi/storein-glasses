import { useHead } from '@unhead/vue'
import { computed, isRef } from 'vue'
import { useSettingsStore } from '@/stores/settings.store'

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://storein.ir'

function resolve(val) {
  return isRef(val) ? val.value : (typeof val === 'function' ? val() : val)
}

function toAbsoluteImage(img) {
  if (!img) return null
  return img.startsWith('http') ? img : `${BASE_URL}${img}`
}

/**
 * Page-level SEO composable — call inside <script setup> of each view.
 *
 * @param {object} opts
 * @param {string|Ref|ComputedRef} [opts.title]         - Page-specific title (without site name)
 * @param {string|Ref|ComputedRef} [opts.description]   - Page-specific description
 * @param {string|Ref|ComputedRef} [opts.image]         - Relative or absolute image URL
 * @param {string|Ref|ComputedRef} [opts.canonicalPath] - Path like '/product/slug' (no domain)
 * @param {'website'|'article'|'product'} [opts.type]  - og:type
 * @param {boolean} [opts.noindex]                      - Set true for auth/cart/user pages
 */
export function useSeoHead({
  title         = null,
  description   = null,
  image         = null,
  canonicalPath = null,
  type          = 'website',
  noindex       = false,
} = {}) {
  const settings = useSettingsStore()

  const resolvedTitle = computed(() => {
    const t = resolve(title)
    return t || null   // titleTemplate in useHead.js handles the "| SiteName" suffix
  })

  const resolvedDescription = computed(() => {
    const d = resolve(description)
    return d || settings.description || settings.tagline || ''
  })

  const resolvedImage = computed(() => toAbsoluteImage(resolve(image)) || toAbsoluteImage(settings.ogImage))

  const resolvedCanonical = computed(() => {
    const p = resolve(canonicalPath)
    return p ? `${BASE_URL}${p}` : null
  })

  useHead({
    title: resolvedTitle,

    meta: [
      { name: 'description',        content: resolvedDescription },
      { name: 'keywords',           content: () => settings.keywords || null },
      { name: 'robots',             content: noindex ? 'noindex,nofollow' : 'index,follow' },

      // Open Graph
      { property: 'og:type',        content: type },
      { property: 'og:site_name',   content: () => settings.siteName },
      { property: 'og:title',       content: resolvedTitle },
      { property: 'og:description', content: resolvedDescription },
      { property: 'og:image',       content: resolvedImage },
      { property: 'og:locale',      content: 'fa_IR' },
      { property: 'og:url',         content: resolvedCanonical },

      // Twitter Card
      { name: 'twitter:card',        content: 'summary_large_image' },
      { name: 'twitter:title',       content: resolvedTitle },
      { name: 'twitter:description', content: resolvedDescription },
      { name: 'twitter:image',       content: resolvedImage },
    ],

    link: [
      { rel: 'canonical', href: resolvedCanonical },
    ],
  })
}
