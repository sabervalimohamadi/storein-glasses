export const ORDER_STATUSES = {
  pending:    { label: 'در انتظار پرداخت', color: 'warning' },
  paid:       { label: 'پرداخت شده',       color: 'info'    },
  processing: { label: 'در حال پردازش',    color: 'info'    },
  shipped:    { label: 'ارسال شده',         color: 'info'    },
  delivered:  { label: 'تحویل داده شده',   color: 'success' },
  cancelled:  { label: 'لغو شده',           color: 'error'   },
  refunded:   { label: 'مسترد شده',         color: 'error'   },
}

export const PRODUCT_STATUSES = {
  active:   { label: 'فعال',     color: 'success' },
  draft:    { label: 'پیش‌نویس', color: 'warning' },
  inactive: { label: 'غیرفعال',  color: 'error'   },
}

export const REVIEW_STATUSES = {
  pending:  { label: 'در انتظار', color: 'warning' },
  approved: { label: 'تأیید شده', color: 'success' },
  rejected: { label: 'رد شده',    color: 'error'   },
}

export const SORT_DIRS   = { asc: 'صعودی', desc: 'نزولی' }
export const ITEMS_PER_PAGE = 20
