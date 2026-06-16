import http from './http.service'

export const notificationService = {
  broadcast: (data) => http.post('/notifications/admin/broadcast', data),
  sendSms:   (data) => http.post('/notifications/admin/sms',       data),
}
