import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { orderService } from '@/services/orderService'
import { formatPrice, formatDate, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/lib/utils'
import type { Order } from '@/types'
import { Search, Package, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams()
  const [orderCode, setOrderCode] = useState(
    searchParams.get('code') || searchParams.get('orderCode') || ''
  )
  const [phone, setPhone] = useState(searchParams.get('phone') || '')

  const track = useMutation({
    mutationFn: () => orderService.track(orderCode, phone),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không tìm thấy đơn hàng!')
    },
  })

  // Auto-submit if both parameters are present in URL
  useEffect(() => {
    const code = searchParams.get('code') || searchParams.get('orderCode')
    const phoneParam = searchParams.get('phone')
    if (code && phoneParam) {
      track.mutate()
    }
  }, []) // Only run once on mount

  const order: Order | undefined = track.data?.data?.data

  const STATUS_STEPS: Array<{ key: Order['status']; label: string }> = [
    { key: 'pending',    label: 'Chờ xác nhận' },
    { key: 'confirmed',  label: 'Đã xác nhận' },
    { key: 'processing', label: 'Đóng gói' },
    { key: 'shipping',   label: 'Đang giao' },
    { key: 'delivered',  label: 'Đã giao' },
    { key: 'completed',  label: 'Hoàn thành' },
  ]

  const currentStep = order ? STATUS_STEPS.findIndex(s => s.key === order.status) : -1

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Tra cứu đơn hàng</h1>
      <p className="text-gray-500 mb-6">Nhập mã đơn hàng và số điện thoại đặt hàng để tra cứu</p>

      <div className="card p-6 mb-6">
        <form onSubmit={e => { e.preventDefault(); track.mutate() }} className="flex flex-col sm:flex-row gap-3">
          <input value={orderCode} onChange={e => setOrderCode(e.target.value.toUpperCase())}
            placeholder="Mã đơn hàng (VD: HC-2026-000001)"
            className="input flex-1" required />
          <input value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="Số điện thoại đặt hàng"
            className="input sm:w-48" required />
          <button type="submit" disabled={track.isPending} className="btn-primary flex items-center gap-2 px-6">
            <Search size={16} /> {track.isPending ? 'Đang tra...' : 'Tra cứu'}
          </button>
        </form>
      </div>

      {track.isError && (
        <div className="card p-6 text-center text-red-500">
          <Package size={40} className="mx-auto mb-2 opacity-50" />
          <p>Không tìm thấy đơn hàng. Kiểm tra lại mã đơn và số điện thoại.</p>
        </div>
      )}

      {order && (
        <div className="space-y-4">
          {/* Deposit payment banner */}
          {order.status === 'pending_deposit' && !order.depositPaid && (
            <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-5">
              <h3 className="font-bold text-orange-700 mb-1 flex items-center gap-2">
                <CreditCard size={18} /> Cần thanh toán cọc
              </h3>
              <p className="text-sm text-orange-600 mb-3">
                Đơn hàng đang chờ bạn thanh toán cọc <strong>{formatPrice(order.depositAmount)}</strong>.
                Vui lòng thanh toán để xác nhận đơn hàng.
              </p>
              <Link
                to={`/thanh-toan-coc?orderCode=${order.orderCode}&phone=${encodeURIComponent(phone)}`}
                className="inline-block bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-orange-600 transition"
              >
                Thanh toán cọc ngay
              </Link>
            </div>
          )}

          {/* Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{order.orderCode}</h2>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${ORDER_STATUS_LABEL[order.status]?.color}`}>
                {ORDER_STATUS_LABEL[order.status]?.label}
              </span>
            </div>

            {/* Progress bar */}
            {order.status !== 'cancelled' && (
              <div className="relative">
                <div className="flex justify-between mb-2">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step.key} className={`flex flex-col items-center text-xs ${i <= currentStep ? 'text-primary-500' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] mb-1
                        ${i < currentStep ? 'bg-primary-500 text-white' : i === currentStep ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-gray-200'}`}>
                        {i < currentStep ? 'OK' : i + 1}
                      </div>
                      <span className="hidden sm:block text-center w-16">{step.label}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-200 -z-10">
                  <div className="h-full bg-primary-500 transition-all"
                    style={{ width: `${currentStep < 0 ? 0 : (currentStep / (STATUS_STEPS.length - 1)) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-semibold mb-3">Địa chỉ giao hàng</h3>
              <p className="text-sm font-medium">{order.shippingName}</p>
              <p className="text-sm text-gray-500">{order.shippingPhone}</p>
              <p className="text-sm text-gray-500">{order.shippingAddress}, {order.shippingWard}, {order.shippingProvince}</p>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold mb-3">Thông tin thanh toán</h3>
              <p className="text-sm text-gray-600">Phương thức:</p>
              <p className="text-sm font-medium mb-2">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
              <p className="text-sm text-gray-600">Thời gian đặt hàng:</p>
              <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Items */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Sản phẩm ({order.items.length})</h3>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.productImage || '/placeholder.png'} alt={item.productName}
                    className="w-14 h-14 object-contain bg-gray-50 rounded-lg border" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-gray-400">x{item.quantity} - BH: {item.warrantyMonths} tháng</p>
                  </div>
                  <p className="font-semibold text-sm">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Chi tiết thanh toán</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="font-medium">{formatPrice(order.shippingFee)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Giảm giá:</span>
                  <span className="font-medium text-green-600">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-semibold text-base">Tổng thanh toán:</span>
                <span className="font-bold text-lg text-primary-500">{formatPrice(order.totalAmount)}</span>
              </div>
              {order.depositAmount != null && order.depositAmount > 0 && (
                <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={order.depositPaid ? 'text-green-600' : 'text-orange-600'}>
                      {order.depositPaid ? 'Đã cọc:' : 'Tiền cọc cần trả:'}
                    </span>
                    <span className={`font-semibold ${order.depositPaid ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatPrice(order.depositAmount)}
                    </span>
                  </div>
                  {order.remainingAmount != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Còn lại khi nhận hàng:</span>
                      <span className="font-medium">{formatPrice(order.remainingAmount)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
