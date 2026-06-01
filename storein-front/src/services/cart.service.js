import http from './http.service'
export const cartService = {
  get:        ()                     => http.get('/cart'),
  addItem:    (productId, quantity)  => http.post('/cart/items',           { productId, quantity }),
  updateItem: (itemId, quantity)     => http.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId)               => http.delete(`/cart/items/${itemId}`),
  clear:      ()                     => http.delete('/cart'),
}
