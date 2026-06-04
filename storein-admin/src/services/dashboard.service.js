import http from './http.service'
export const dashboardService = {
  getStats: () => http.get('/admin/dashboard'),
}
