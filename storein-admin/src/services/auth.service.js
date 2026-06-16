import http from './http.service'
export const authService = {
  sendOtp:        (phone)                           => http.post('/auth/send-otp',         { phone }),
  verifyOtp:      (phone, code)                     => http.post('/auth/verify-otp',        { phone, code }),
  adminLogin:     (phone, password)                 => http.post('/auth/admin-login',       { phone, password }),
  changePassword: (currentPassword, newPassword)    => http.post('/auth/change-password',   { currentPassword, newPassword }),
  refresh:        ()                                => http.post('/auth/refresh', {}, { skipErrorLog: true, skipAuthRedirect: true }),
  getProfile:     ()                                => http.get('/users/me'),
}
