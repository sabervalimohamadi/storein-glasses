import http from './http.service'
export const productService = {
  getAll:     (params)       => http.get('/products',              { params }),
  getBySlug:  (slug)         => http.get(`/products/${slug}`),
  search:     (q, params)    => http.get('/products/search',       { params: { q, ...params } }),
  getRelated: (slug)         => http.get(`/products/${slug}/related`),
}
