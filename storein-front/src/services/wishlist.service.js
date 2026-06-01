import http from './http.service'

export const wishlistService = {
  getAll:  ()           => http.get('/wishlist'),
  toggle:  (productId)  => http.post(`/wishlist/${productId}`),
  check:   (productId)  => http.get(`/wishlist/${productId}/check`),
  clear:   ()           => http.delete('/wishlist'),
}
