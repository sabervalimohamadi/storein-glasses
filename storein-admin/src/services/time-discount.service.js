import { http } from './http.service'

export const timeDiscountService = {
  getAll:   (params) => http.get('/time-discounts', { params }),
  getById:  (id)     => http.get(`/time-discounts/${id}`),
  create:   (data)   => http.post('/time-discounts', data),
  update:   (id, data) => http.patch(`/time-discounts/${id}`, data),
  toggle:   (id)     => http.patch(`/time-discounts/${id}/toggle`),
  remove:   (id)     => http.delete(`/time-discounts/${id}`),
}
