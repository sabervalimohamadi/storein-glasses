import http from './http.service'
export const userService = {
  getAll:  (params) => http.get('/users',             { params }),
  getById: (id)     => http.get(`/users/${id}`),
  block:   (id)     => http.patch(`/users/${id}/block`),
}
