import { http } from './http.service'

export const timeDiscountService = {
  getActive: () => http.get('/time-discounts/active'),
}
