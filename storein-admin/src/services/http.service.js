import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, Promise.reject)

http.interceptors.response.use(
  (res) => {
    if (res.data && 'data' in res.data) res.data = res.data.data
    return res
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    if (err.response?.status === 403) {
      window.location.href = '/login?error=forbidden'
    }
    return Promise.reject(err)
  }
)

export default http
