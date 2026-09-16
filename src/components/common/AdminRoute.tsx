import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore()
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để truy cập trang quản trị!')
    } else if (user && user.role !== 'admin' && user.role !== 'staff' && user.role !== 'technician') {
      toast.error('Bạn không có quyền truy cập trang này!')
    }
  }, [isAuthenticated, user])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin' && user?.role !== 'staff' && user?.role !== 'technician') return <Navigate to="/" replace />
  return <Outlet />
}
