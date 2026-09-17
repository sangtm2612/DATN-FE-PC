import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '@/services/orderService'
import { createVNPayPayment, createZaloPayPayment } from '@/services/paymentService'
import { formatPrice, formatDate, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/lib/utils'
import { ChevronLeft, Package, AlertCircle, Smartphone, Tag, Truck, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getDetail(Number(id)).then(r => r.data.data),
  })

  const [depositGateway, setDepositGateway] = useState<'vnpay' | 'zalopay'>('vnpay')
  const [retryingDeposit, setRetryingDeposit] = useState(false)

  const cancel = useMutation({
    mutationFn: (reason: string) => orderService.cancel(Number(id), reason),
    onSuccess: () => { toast.success('Hủy đơn thành công'); qc.invalidateQueries({ queryKey: ['order', id] }) },
  })

  const retryDeposit = async () => {
    if (!order || retryingDeposit) return
    setRetryingDeposit(true)
    try {
      const url = depositGateway === 'vnpay'
        ? await createVNPayPayment(order.id, order.depositAmount)
        : await createZaloPayPayment(order.id, order.depositAmount)
      window.location.href = url
    } catch (e: any) {
      toast.error(e.message || 'Không thể tạo thanh toán. Vui lòng thử lại.')
      setRetryingDeposit(false)
    }
  }

  if (isLoading) return <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
  if (!order) return <div className="text-center py-12 text-gray-500">Không tìm thấy đơn hàng</div>

  const statusInfo = ORDER_STATUS_LABEL[order.status]
  const canReturn = (order.status === 'delivered' || order.status === 'completed')
    && !!order.deliveredAt
    && (Date.now() - new Date(order.deliveredAt).getTime()) <= 15 * 24 * 60 * 60 * 1000

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/account/orders" className="text-gray-500 hover:text-primary-500 flex items-center gap-1">
          <ChevronLeft size={16} /> Đơn hàng
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-gray-800">{order.orderCode}</span>
      </div>

      {/* Status */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{order.orderCode}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Đặt ngày {formatDate(order.createdAt)}</p>
            {order.buildId && (
              <p className="text-xs text-primary-500 mt-1">Đặt từ cấu hình PC: {order.buildName}</p>
            )}
          </div>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${statusInfo?.color}`}>
            {statusInfo?.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Shipping */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Địa chỉ giao hàng</h3>
          <p className="font-medium">{order.shippingName}</p>
          <p className="text-sm text-gray-500">{order.shippingPhone}</p>
          <p className="text-sm text-gray-500 mt-1">
            {order.shippingAddress}, {order.shippingWard}, {order.shippingProvince}
          </p>
        </div>

        {/* Payment */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Receipt size={16} /> Thanh toán</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              order.paymentStatus === 'paid'     ? 'bg-green-100 text-green-700' :
              order.paymentStatus === 'failed'   ? 'bg-red-100 text-red-700' :
              order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {order.paymentStatus === 'paid'     ? 'Đã thanh toán' :
               order.paymentStatus === 'failed'   ? 'Thất bại' :
               order.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Chờ thanh toán'}
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-3">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>

          <div className="space-y-2 text-sm">
            {/* Subtotal */}
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính ({order.items.length} sản phẩm)</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between text-gray-600">
              <span className="flex items-center gap-1"><Truck size={12} /> Phí vận chuyển</span>
              <span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : <span className="text-green-600 font-medium">Miễn phí</span>}</span>
            </div>

            {/* Discount breakdown */}
            {order.discountAmount > 0 && (
              <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 space-y-1">
                <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                  <Tag size={11} /> Ưu đãi áp dụng
                </p>
                {order.voucherCode ? (
                  <div className="flex justify-between text-green-700 text-xs">
                    <span className="flex items-center gap-1">
                      Voucher <span className="font-mono bg-green-100 px-1.5 py-0.5 rounded font-bold">{order.voucherCode}</span>
                    </span>
                    <span className="font-semibold">-{formatPrice(order.discountAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-green-700 text-xs">
                    <span>Giảm giá tự động</span>
                    <span className="font-semibold">-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
              <span>Tổng thanh toán</span>
              <span className="text-primary-600 text-lg">{formatPrice(order.totalAmount)}</span>
            </div>

            {/* Tiết kiệm */}
            {order.discountAmount > 0 && (
              <p className="text-xs text-center text-green-600 font-medium bg-green-50 rounded-lg py-1.5">
                Bạn đã tiết kiệm {formatPrice(order.discountAmount)} cho đơn hàng này 🎉
              </p>
            )}

            {/* Deposit */}
            {(order.depositAmount ?? 0) > 0 && (
              <div className="border-t border-dashed pt-2 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className={order.depositPaid ? 'text-green-600' : 'text-orange-600'}>
                    {order.depositPaid ? 'Đã cọc' : 'Cọc cần trả'}
                  </span>
                  <span className={`font-semibold ${order.depositPaid ? 'text-green-600' : 'text-orange-600'}`}>
                    {formatPrice(order.depositAmount ?? 0)}
                  </span>
                </div>
                {!order.depositPaid && (
                  <div className="flex justify-between text-gray-500">
                    <span>Còn lại khi nhận hàng</span>
                    <span className="font-medium">{formatPrice(order.remainingAmount ?? 0)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5 mb-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Package size={16} /> Sản phẩm ({order.items.length})
        </h3>
        <div className="divide-y">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-4 py-3">
              <img src={item.productImage || '/placeholder.png'} alt={item.productName}
                className="w-16 h-16 object-contain bg-gray-50 rounded-xl border flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Link to={`/san-pham/${item.productId}`}
                  className="font-medium hover:text-primary-500 transition-colors line-clamp-2 text-sm">
                  {item.productName}
                </Link>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{formatPrice(item.unitPrice)} × {item.quantity}</span>
                  {item.warrantyMonths > 0 && (
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                      BH {item.warrantyMonths}T
                    </span>
                  )}
                </div>
              </div>
              <p className="font-bold text-sm text-primary-600 flex-shrink-0">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit warning — hiện khi đơn COD chưa thanh toán cọc */}
      {order.status === 'pending_deposit' && (
        <div className="card p-5 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-800">Cần thanh toán cọc để xác nhận đơn hàng</h3>
              <p className="text-sm text-orange-700 mt-1">
                Đơn hàng sẽ tự động hủy nếu không thanh toán cọc trong vòng 15 phút kể từ khi đặt hàng.
              </p>
            </div>
          </div>

          {/* Deposit summary */}
          <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tiền cọc cần thanh toán ngay:</span>
              <span className="font-semibold text-orange-600">{formatPrice(order.depositAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Còn lại thanh toán khi nhận hàng:</span>
              <span className="font-medium">{formatPrice(order.remainingAmount ?? 0)}</span>
            </div>
          </div>

          {/* Gateway selector */}
          <div className="flex gap-2 mb-3">
            {(['vnpay', 'zalopay'] as const).map(g => (
              <button key={g}
                onClick={() => setDepositGateway(g)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors
                  ${depositGateway === g ? 'border-primary-500 bg-white text-primary-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <Smartphone size={15} />
                {g === 'vnpay' ? 'VNPay' : 'ZaloPay'}
              </button>
            ))}
          </div>

          <button onClick={retryDeposit} disabled={retryingDeposit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60">
            {retryingDeposit ? 'Đang chuyển hướng...' : `Thanh toán cọc ${formatPrice(order.depositAmount ?? 0)} qua ${depositGateway === 'vnpay' ? 'VNPay' : 'ZaloPay'}`}
          </button>

          <button
            onClick={() => { const r = window.prompt('Lý do hủy (tùy chọn):'); if (r !== null) cancel.mutate(r) }}
            disabled={cancel.isPending}
            className="w-full mt-2 text-sm text-red-500 border border-red-300 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            {cancel.isPending ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </button>
        </div>
      )}

      {/* Actions */}
      {order.status === 'pending' && (
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Thao tác</h3>
          <button
            onClick={() => {
              const reason = window.prompt('Lý do hủy đơn (tùy chọn):')
              if (reason !== null) cancel.mutate(reason)
            }}
            disabled={cancel.isPending}
            className="text-red-500 border border-red-300 px-4 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors"
          >
            {cancel.isPending ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </button>
          <p className="text-xs text-gray-400 mt-2">Chỉ có thể hủy đơn khi đang ở trạng thái "Chờ xác nhận"</p>
        </div>
      )}

      {canReturn && (
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Thao tác</h3>
          <Link to={`/account/orders/${order.id}/return`}
            className="inline-block text-primary-500 border border-primary-300 px-4 py-2 rounded-lg text-sm hover:bg-primary-50 transition-colors">
            Yêu cầu đổi/trả hàng
          </Link>
          <p className="text-xs text-gray-400 mt-2">Áp dụng trong vòng 15 ngày kể từ khi nhận hàng</p>
        </div>
      )}
    </div>
  )
}
