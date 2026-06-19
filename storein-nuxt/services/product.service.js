import http from './http.service'
export const productService = {
  getAll:     (params)    => http.get('/products',              { params }),
  getBySlug:  (slug)      => http.get(`/products/slug/${slug}`),
  search:     (q, params) => http.get('/search',               { params: { q, ...params } }),
  getRelated: (slug)      => http.get(`/products/${slug}/related`),
}
