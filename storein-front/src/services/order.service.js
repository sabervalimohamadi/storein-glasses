import http from './http.service'
export const orderService = {
  getMyOrders: (params) => http.get('/orders/my', { params }),
  getMyOrder:  (id)     => http.get(`/orders/my/${id}`),
  cancelOrder: (id)     => http.patch(`/orders/my/${id}/cancel`),
}
