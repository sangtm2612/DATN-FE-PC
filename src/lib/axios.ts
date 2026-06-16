import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Attach session id for guest cart
  const sessionId = localStorage.getItem('session_id')
  if (sessionId) config.headers['X-Session-Id'] = sessionId

  return config
})

// Response interceptor — handle 401 refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          const { data } = await axios.post('/api/auth/refresh', null, {
            params: { refreshToken },
          })
          useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken)
          original.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api(original)
        }
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    const msg = error.response?.data?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại'
    if (error.response?.status !== 401) toast.error(msg)

    return Promise.reject(error)
  }
)

export default api
