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

export const PRODUCT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f1f5f9'/%3E%3Cpath d='M60 110 Q100 70 140 110' stroke='%23cbd5e1' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='72' cy='105' r='18' stroke='%23cbd5e1' stroke-width='3' fill='none'/%3E%3Ccircle cx='128' cy='105' r='18' stroke='%23cbd5e1' stroke-width='3' fill='none'/%3E%3Cline x1='42' y1='100' x2='54' y2='105' stroke='%23cbd5e1' stroke-width='3' stroke-linecap='round'/%3E%3Cline x1='146' y1='105' x2='158' y2='100' stroke='%23cbd5e1' stroke-width='3' stroke-linecap='round'/%3E%3Cline x1='90' y1='107' x2='110' y2='107' stroke='%23cbd5e1' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E"
