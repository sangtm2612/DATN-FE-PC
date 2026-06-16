import api from '@/lib/axios'
import type { AuthResponse } from '@/types'

export const authService = {
  register: (data: { fullName: string; email: string; phone: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { credential: string; password: string }) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data),

  verifyEmail: (otp: string) =>
    api.post('/auth/verify-email', null, { params: { otp } }),

  refresh: (refreshToken: string) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/refresh', null, {
      params: { refreshToken },
    }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', null, { params: { email } }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', null, { params: { token, newPassword } }),
}
