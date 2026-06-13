import http from './http.service'
export const authService = {
  sendOtp:    (phone)       => http.post('/auth/send-otp',  { phone }),
  verifyOtp:  (phone, code) => http.post('/auth/verify-otp', { phone, code }),
  getProfile: ()            => http.get('/users/me'),
  logout:     ()            => http.post('/auth/logout'),
  refresh:    ()            => http.post(
    '/auth/refresh', {},
    { headers: { Authorization: `Bearer ${localStorage.getItem('refresh_token') ?? ''}` } },
  ),
}
