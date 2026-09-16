import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'

export default function OrderSuccessPage() {
  const { code } = useParams()
  const { setCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  // Clear cart khi vào trang này
  useEffect(() => {
    setCart({ items: [], totalItems: 0, totalAmount: 0 })
  }, [setCart])

  return (
    <div className="container py-16 max-w-lg text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={42} className="text-green-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h1>
      <p className="text-gray-500 mb-2">Mã đơn hàng của bạn:</p>
      <p className="text-xl font-bold text-primary-500 mb-4">{code}</p>
      <p className="text-gray-500 text-sm mb-8">
        {isAuthenticated 
          ? 'Chúng tôi đã gửi email xác nhận đơn hàng. Cảm ơn bạn đã tin tưởng KinhDuanPC!'
          : 'Đơn hàng của bạn đã được ghi nhận. Vui lòng tra cứu đơn hàng bằng mã và số điện thoại!'}
      </p>
      <div className="flex gap-3 justify-center">
        {isAuthenticated ? (
          <Link to="/account/orders" className="btn-primary px-6 py-2.5">Xem đơn hàng</Link>
        ) : (
          <Link to="/tra-don-hang" className="btn-primary px-6 py-2.5">Tra cứu đơn hàng</Link>
        )}
        <Link to="/" className="btn-outline px-6 py-2.5">Tiếp tục mua sắm</Link>
      </div>
    </div>
  )
}
