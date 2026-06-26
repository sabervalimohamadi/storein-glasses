import { describe, it, expect } from 'vitest'
import { PANEL_PERMISSIONS } from './constants'

describe('PANEL_PERMISSIONS', () => {

  // ── Structure ──────────────────────────────────────────────────────────────

  it('every entry has key, label, icon and group', () => {
    for (const p of PANEL_PERMISSIONS) {
      expect(p.key,   `missing key in ${JSON.stringify(p)}`).toBeTruthy()
      expect(p.label, `missing label for key "${p.key}"`).toBeTruthy()
      expect(p.icon,  `missing icon for key "${p.key}"`).toBeTruthy()
      expect(p.group, `missing group for key "${p.key}"`).toBeTruthy()
    }
  })

  it('keys are unique', () => {
    const keys = PANEL_PERMISSIONS.map(p => p.key)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })

  // ── Core permissions present ───────────────────────────────────────────────

  const requiredKeys = [
    'dashboard',
    'products', 'categories', 'brands', 'colors', 'banners', 'orders', 'discounts',
    'wholesale', 'wholesale-orders',
    'users', 'reviews',
    'blog', 'blog-comments', 'pages',
  ]

  it.each(requiredKeys)('includes "%s" permission', (key) => {
    expect(PANEL_PERMISSIONS.some(p => p.key === key)).toBe(true)
  })

  // ── Groups ─────────────────────────────────────────────────────────────────

  const expectedGroups = ['عمومی', 'فروشگاه', 'عمده', 'مدیریت', 'محتوا']

  it('contains all expected groups', () => {
    const groups = [...new Set(PANEL_PERMISSIONS.map(p => p.group))]
    for (const g of expectedGroups) {
      expect(groups).toContain(g)
    }
  })

  it('wholesale permissions are in "عمده" group', () => {
    const wholesalePerms = PANEL_PERMISSIONS.filter(p =>
      p.key === 'wholesale' || p.key === 'wholesale-orders'
    )
    expect(wholesalePerms).toHaveLength(2)
    wholesalePerms.forEach(p => expect(p.group).toBe('عمده'))
  })

  it('pages permission is in "محتوا" group', () => {
    const pages = PANEL_PERMISSIONS.find(p => p.key === 'pages')
    expect(pages).toBeDefined()
    expect(pages.group).toBe('محتوا')
  })

  it('blog-comments is a separate permission from blog', () => {
    const blog         = PANEL_PERMISSIONS.find(p => p.key === 'blog')
    const blogComments = PANEL_PERMISSIONS.find(p => p.key === 'blog-comments')
    expect(blog).toBeDefined()
    expect(blogComments).toBeDefined()
    expect(blog.key).not.toBe(blogComments.key)
  })

  // ── Router alignment ───────────────────────────────────────────────────────

  it('router-referenced permissions all exist in PANEL_PERMISSIONS', async () => {
    // These are the permission values used in router/index.js meta.permission
    const routerPermissions = [
      'dashboard', 'products', 'categories', 'brands', 'colors',
      'orders', 'users', 'reviews', 'discounts', 'banners',
      'blog', 'blog-comments', 'pages', 'wholesale', 'wholesale-orders',
    ]
    const defined = new Set(PANEL_PERMISSIONS.map(p => p.key))
    for (const perm of routerPermissions) {
      expect(defined.has(perm), `router uses "${perm}" but it's not in PANEL_PERMISSIONS`).toBe(true)
    }
  })
})
