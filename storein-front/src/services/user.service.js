import http from './http.service'
export const userService = {
  getProfile:     ()           => http.get('/user/profile'),
  updateProfile:  (data)       => http.patch('/user/profile', data),
  getOrders:      (params)     => http.get('/user/orders',    { params }),
  getOrderById:   (id)         => http.get(`/user/orders/${id}`),
  getFavorites:   ()           => http.get('/user/favorites'),
  addFavorite:    (productId)  => http.post('/user/favorites',           { productId }),
  removeFavorite: (productId)  => http.delete(`/user/favorites/${productId}`),
  getAddresses:   ()           => http.get('/user/addresses'),
  addAddress:     (data)       => http.post('/user/addresses',           data),
  updateAddress:  (id, data)   => http.patch(`/user/addresses/${id}`,   data),
  deleteAddress:  (id)         => http.delete(`/user/addresses/${id}`),
}
