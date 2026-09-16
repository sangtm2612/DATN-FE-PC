import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tiếp tục!')
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}
