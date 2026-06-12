import http from './http.service'

export const frameAttributeService = {
  getActive: (type)     => http.get('/frame-attributes', { params: { type } }),
  getAll:    (type)     => http.get('/frame-attributes/admin/all', { params: { type } }),
  create:    (dto)      => http.post('/frame-attributes', dto),
  update:    (id, dto)  => http.patch(`/frame-attributes/${id}`, dto),
  remove:    (id)       => http.delete(`/frame-attributes/${id}`),
}
