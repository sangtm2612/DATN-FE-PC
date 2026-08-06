import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

/**
 * DEV ONLY - Mock Payment Page
 * Trang test thanh toán mà không cần MoMo/VNPay thật
 */
export default function DevMockPaymentPage() {
  const navigate = useNavigate()
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMockPayment = async (gateway: 'momo' | 'vnpay' | 'zalopay', status: 'success' | 'failed') => {
    if (!orderId) {
      toast.error('Vui lòng nhập Order ID')
      return
    }

    setLoading(true)
    try {
      const endpoint = `/mock/payments/${gateway}/${status}`
      const response = await api.post(endpoint, null, {
        params: { orderId: Number(orderId) }
      })

      const { redirectUrl } = response.data.data
      toast.success(response.data.message)

      // Redirect sau 1s
      setTimeout(() => {
        window.location.href = redirectUrl
      }, 1000)

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-2xl">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-yellow-900">Development Only - Mock Payment</h3>
            <p className="text-sm text-yellow-800 mt-1">
              Trang này chỉ dùng để test thanh toán mà không cần MoMo/VNPay thật. 
              Sẽ không hoạt động trong production.
            </p>
          </div>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold mb-6">🧪 Mock Payment Testing</h1>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Order ID</label>
            <input
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Nhập Order ID (ví dụ: 1, 2, 3...)"
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lấy Order ID sau khi tạo đơn hàng (check database hoặc API response)
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" />
                Mock Thanh Toán Thành Công
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleMockPayment('momo', 'success')}
                  disabled={loading || !orderId}
                  className="btn-primary py-3"
                >
                  ✅ MoMo Success
                </button>
                <button
                  onClick={() => handleMockPayment('vnpay', 'success')}
                  disabled={loading || !orderId}
                  className="btn-primary py-3"
                >
                  ✅ VNPay Success
                </button>
                <button
                  onClick={() => handleMockPayment('zalopay', 'success')}
                  disabled={loading || !orderId}
                  className="btn-primary py-3"
                >
                  ✅ ZaloPay Success
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <XCircle size={18} className="text-red-500" />
                Mock Thanh Toán Thất Bại
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleMockPayment('momo', 'failed')}
                  disabled={loading || !orderId}
                  className="btn-outline py-3"
                >
                  ❌ MoMo Failed
                </button>
                <button
                  onClick={() => handleMockPayment('vnpay', 'failed')}
                  disabled={loading || !orderId}
                  className="btn-outline py-3"
                >
                  ❌ VNPay Failed
                </button>
                <button
                  onClick={() => handleMockPayment('zalopay', 'failed')}
                  disabled={loading || !orderId}
                  className="btn-outline py-3"
                >
                  ❌ ZaloPay Failed
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Cách sử dụng:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Tạo đơn hàng bình thường qua checkout</li>
              <li>Lấy Order ID (check database hoặc response)</li>
              <li>Nhập Order ID vào ô trên</li>
              <li>Click button mock payment</li>
              <li>Sẽ tự động redirect về payment result</li>
            </ol>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Về trang chủ
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold mb-2">📝 Test Flow:</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p>1. Tạo đơn hàng → Chọn MoMo/VNPay</p>
            <p>2. Vào <code className="bg-white px-2 py-0.5 rounded">/dev-mock-payment</code></p>
            <p>3. Mock thanh toán thành công/thất bại</p>
            <p>4. Kiểm tra order status trong database</p>
          </div>
        </div>
      </div>
    </div>
  )
}
