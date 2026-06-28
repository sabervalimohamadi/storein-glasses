import { http } from '~/services/http.service'

export const frameAttributeService = {
  getActive: (type) => http.get('/frame-attributes', { params: { type } }),
}
