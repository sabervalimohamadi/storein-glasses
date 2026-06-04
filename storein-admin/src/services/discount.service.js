import http from './http.service'
export const discountService = {
  getAll:  (params) => http.get('/discounts',             { params }),
  create:  (data)   => http.post('/discounts',             data),
  update:  (id, d)  => http.patch(`/discounts/${id}`,      d),
  remove:  (id)     => http.delete(`/discounts/${id}`),
  toggle:  (id)     => http.patch(`/discounts/${id}/toggle`),
}
