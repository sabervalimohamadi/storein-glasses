import http from './http.service'

/**
 * Coupons are Discounts that have a `code` field set.
 * The backend unified endpoint is /discounts — this service
 * is a thin wrapper that passes hasCode=true for list queries
 * and maps legacy form field names to the unified DTO.
 */
export const couponService = {
  getAll:     (params)   => http.get('/discounts',         { params: { ...params, hasCode: true } }),
  getById:    (id)       => http.get(`/discounts/${id}`),
  create:     (data)     => http.post('/discounts',        _mapCouponDto(data)),
  update:     (id, data) => http.patch(`/discounts/${id}`, _mapCouponDto(data)),
  toggle:     (id)       => http.patch(`/discounts/${id}/toggle`),
  softDelete: (id)       => http.delete(`/discounts/${id}`),
}

/**
 * Maps coupon-form fields → unified Discount DTO.
 * DiscountFormModal uses legacy names (type, usageLimit, maxDiscount).
 */
function _mapCouponDto(data) {
  const dto = {
    title:             data.code?.trim() || data.title || 'کوپن تخفیف',
    description:       data.description        || undefined,
    discountType:      data.discountType || data.type,   // modal uses 'type'
    value:             data.value,
    maxDiscountAmount: data.maxDiscountAmount ?? data.maxDiscount ?? null,
    minOrderAmount:    data.minOrderAmount     ?? null,
    maxUsageCount:     data.maxUsageCount      ?? data.usageLimit ?? null,
    perUserLimit:      data.perUserLimit       ?? 1,
    startDate:         data.startDate          || null,
    endDate:           data.endDate            || null,
    isActive:          data.isActive           ?? true,
    targetType:        'all',
    code:              data.code?.trim()       || undefined,
  }
  // Remove undefined/null keys that shouldn't be sent
  Object.keys(dto).forEach(k => {
    if (dto[k] === undefined) delete dto[k]
  })
  return dto
}
