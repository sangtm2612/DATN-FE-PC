import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export function decodeTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const exp = decodeTokenExp(token)
  if (!exp) return true
  return Date.now() / 1000 > exp - 30 // 30s buffer
}

export async function tryRefreshOrLogout(): Promise<boolean> {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) { handleTokenExpired(); return false }
  try {
    const { data } = await axios.post('/api/auth/refresh', null, { params: { refreshToken } })
    useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken)
    return true
  } catch {
    handleTokenExpired()
    return false
  }
}

/**
 * Xử lý logout tập trung
 * @param reason - Lý do logout (optional)
 * @param showToast - Hiển thị toast thông báo (default: true)
 */
export const handleLogout = (reason?: string, showToast: boolean = true) => {
  // Clear auth state
  useAuthStore.getState().logout()
  
  // Show toast if needed
  if (showToast) {
    const message = reason || 'Đã đăng xuất'
    toast.success(message)
  }
  
  // Clear any additional localStorage items if needed
  // localStorage.removeItem('other-data')
}

/**
 * Xử lý logout khi token expired
 */
export const handleTokenExpired = () => {
  useAuthStore.getState().logout()
  toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!')
  
  setTimeout(() => {
    window.location.href = '/login'
  }, 500)
}

/**
 * Kiểm tra xem user có quyền admin/staff không
 */
export const isAdminOrStaff = () => {
  const user = useAuthStore.getState().user
  return user && ['admin', 'staff', 'technician'].includes(user.role)
}

/**
 * Kiểm tra xem user có role cụ thể không
 */
export const hasRole = (role: string | string[]) => {
  const user = useAuthStore.getState().user
  if (!user) return false
  
  if (Array.isArray(role)) {
    return role.includes(user.role)
  }
  
  return user.role === role
}
