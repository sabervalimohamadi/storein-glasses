// ─── Sort ────────────────────────────────────────────────────────
export const SORT_OPTIONS = [
  { label: 'جدیدترین',       value: 'newest'     },
  { label: 'ارزان‌ترین',    value: 'price_asc'  },
  { label: 'گران‌ترین',     value: 'price_desc' },
  { label: 'پرفروش‌ترین',   value: 'bestseller' },
  { label: 'بیشترین تخفیف', value: 'discount'   },
]

// ─── Eyewear Categories ──────────────────────────────────────────
export const EYEWEAR_CATEGORIES = [
  { label: 'عینک آفتابی',  value: 'sunglasses',  slug: 'sunglasses',  icon: '☀️' },
  { label: 'عینک طبی',     value: 'prescription', slug: 'prescription', icon: '👓' },
  { label: 'لنز طبی',      value: 'contact-lens', slug: 'contact-lens', icon: '🔵' },
  { label: 'لوازم جانبی',  value: 'accessories',  slug: 'accessories',  icon: '🧴' },
]

// ─── Frame Shapes ─────────────────────────────────────────────────
export const FRAME_SHAPES = [
  { label: 'گرد',        value: 'round'       },
  { label: 'مربعی',      value: 'square'      },
  { label: 'بیضی',       value: 'oval'        },
  { label: 'مستطیلی',    value: 'rectangular' },
  { label: 'پایلوت',     value: 'aviator'     },
  { label: 'گربه‌ای',    value: 'cat-eye'     },
  { label: 'هشت‌ضلعی',   value: 'octagonal'   },
  { label: 'بی‌فریم',    value: 'rimless'     },
]

// ─── Frame Materials ──────────────────────────────────────────────
export const FRAME_MATERIALS = [
  { label: 'استیل',    value: 'steel'    },
  { label: 'تیتانیوم', value: 'titanium' },
  { label: 'استات',    value: 'acetate'  },
  { label: 'TR90',     value: 'tr90'     },
  { label: 'کربن',     value: 'carbon'   },
]

// ─── Gender ───────────────────────────────────────────────────────
export const GENDER_OPTIONS = [
  { label: 'مردانه',  value: 'men'    },
  { label: 'زنانه',   value: 'women'  },
  { label: 'بچگانه',  value: 'kids'   },
  { label: 'یونیسکس', value: 'unisex' },
]

// ─── Order Statuses ───────────────────────────────────────────────
export const ORDER_STATUSES = {
  pending:    { label: 'در انتظار پرداخت', color: 'yellow' },
  paid:       { label: 'پرداخت شده',       color: 'blue'   },
  processing: { label: 'در حال پردازش',    color: 'blue'   },
  shipped:    { label: 'ارسال شده',         color: 'blue'   },
  delivered:  { label: 'تحویل داده شده',   color: 'green'  },
  cancelled:  { label: 'لغو شده',           color: 'red'    },
}

export const PRODUCT_PLACEHOLDER = '/images/product-placeholder.svg'
