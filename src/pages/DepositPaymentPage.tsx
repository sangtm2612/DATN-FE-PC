import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { orderService } from '@/services/orderService'
import { createVNPayPayment, createZaloPayPayment } from '@/services/paymentService'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order } from '@/types'
import { CreditCard, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DepositPaymentPage() {
  const [searchParams] = useSearchParams()
  const orderCode = searchParams.get('orderCode') || ''
  const phone = searchParams.get('phone') || ''
  const [gateway, setGateway] = useState<'vnpay' | 'zalopay'>('vnpay')
  const [paying, setPaying] = useState(false)

  const track = useMutation({
    mutationFn: () => orderService.track(orderCode, phone),
    onError: () => {
      toast.error('Không tìm thấy đơn hàng. Kiểm tra lại mã đơn và số điện thoại.')
    },
  })

  useEffect(() => {
    if (orderCode && phone) {
      track.mutate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const order: Order | undefined = track.data?.data?.data

  const handlePay = async () => {
    if (!order || paying) return
    if (order.status !== 'pending_deposit') {
      toast.error('Đơn hàng này không cần thanh toán cọc.')
      return
    }
    setPaying(true)
    try {
      const url = gateway === 'vnpay'
        ? await createVNPayPayment(order.id, order.depositAmount)
        : await createZaloPayPayment(order.id, order.depositAmount)
      window.location.href = url
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Không thể tạo thanh toán. Vui lòng thử lại.')
      setPaying(false)
    }
  }

  if (!orderCode || !phone) {
    return (
      <div className="container py-16 max-w-lg text-center">
        <p className="text-gray-500">Link không hợp lệ. Vui lòng kiểm tra lại email.</p>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-2">Thanh toán cọc đơn hàng</h1>
      <p className="text-gray-500 mb-6">Hoàn tất thanh toán cọc để xác nhận đơn hàng COD của bạn</p>

      {track.isPending && (
        <div className="card p-8 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-500" />
          <p className="text-gray-500">Đang tải thông tin đơn hàng...</p>
        </div>
      )}

      {track.isError && (
        <div className="card p-6 text-center text-red-500">
          <p>Không tìm thấy đơn hàng. Vui lòng kiểm tra lại link trong email.</p>
        </div>
      )}

      {order && order.status !== 'pending_deposit' && (
        <div className="card p-6 text-center">
          <p className="text-green-600 font-semibold mb-1">Đơn hàng đã được xác nhận!</p>
          <p className="text-gray-500 text-sm">Cọc của bạn đã được thanh toán thành công trước đó.</p>
        </div>
      )}

      {order && order.status === 'pending_deposit' && (
        <div className="space-y-4">
          {/* Order info */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">{order.orderCode}</h2>
              <span className="text-sm text-orange-600 font-semibold px-3 py-1 rounded-full bg-orange-50 border border-orange-200">
                Chờ thanh toán cọc
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-4">{formatDate(order.createdAt)}</div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng giá trị đơn:</span>
                <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-orange-700 font-medium">Tiền cọc cần thanh toán ngay:</span>
                <span className="font-bold text-orange-600 text-base">{formatPrice(order.depositAmount)}</span>
              </div>
              {order.remainingAmount != null && (
                <div className="flex justify-between text-sm border-t border-orange-200 pt-2">
                  <span className="text-gray-600">Thanh toán khi nhận hàng:</span>
                  <span className="font-semibold">{formatPrice(order.remainingAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gateway selection */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard size={18} />
              Chọn phương thức thanh toán cọc
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGateway('vnpay')}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition ${
                  gateway === 'vnpay'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img src="/vnpay-logo.png" alt="VNPay" className="h-8 object-contain mb-2"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="font-semibold text-sm">VNPay</span>
                <span className="text-xs text-gray-400">ATM / Thẻ quốc tế</span>
              </button>
              <button
                onClick={() => setGateway('zalopay')}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition ${
                  gateway === 'zalopay'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img src="/zalopay-logo.png" alt="ZaloPay" className="h-8 object-contain mb-2"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="font-semibold text-sm">ZaloPay</span>
                <span className="text-xs text-gray-400">Ví ZaloPay</span>
              </button>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full btn-primary py-4 text-base font-semibold flex items-center justify-center gap-2"
          >
            {paying
              ? <><Loader size={18} className="animate-spin" /> Đang chuyển hướng...</>
              : `Thanh toán ${formatPrice(order.depositAmount)} qua ${gateway === 'vnpay' ? 'VNPay' : 'ZaloPay'}`
            }
          </button>

          <p className="text-xs text-center text-gray-400">
            Bạn phải hoàn tất thanh toán cọc trong vòng 15 phút kể từ khi đặt hàng.
            Nếu quá hạn, đơn hàng sẽ bị tự động hủy.
          </p>
        </div>
      )}
    </div>
  )
}
