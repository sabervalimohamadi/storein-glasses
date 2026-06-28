import http from './http.service'

export const couponService = {
  getAll:     (params) => http.get('/coupons', { params }),
  getById:    (id)     => http.get(`/coupons/${id}`),
  create:     (data)   => http.post('/coupons', data),
  update:     (id, data) => http.patch(`/coupons/${id}`, data),
  toggle:     (id)     => http.patch(`/coupons/${id}/toggle`),
  softDelete: (id)     => http.delete(`/coupons/${id}`),
}
