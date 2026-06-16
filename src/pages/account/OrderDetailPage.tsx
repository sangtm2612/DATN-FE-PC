import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '@/services/orderService'
import { formatPrice, formatDate, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/lib/utils'
import { ChevronLeft, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getDetail(Number(id)).then(r => r.data.data),
  })

  const cancel = useMutation({
    mutationFn: (reason: string) => orderService.cancel(Number(id), reason),
    onSuccess: () => { toast.success('Hủy đơn thành công'); qc.invalidateQueries({ queryKey: ['order', id] }) },
  })

  if (isLoading) return <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
  if (!order) return <div className="text-center py-12 text-gray-500">Không tìm thấy đơn hàng</div>

  const statusInfo = ORDER_STATUS_LABEL[order.status]

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
            {order.shippingAddress}, {order.shippingWard}, {order.shippingDistrict}, {order.shippingProvince}
          </p>
        </div>

        {/* Payment */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Thanh toán</h3>
          <p className="text-sm">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính:</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí ship:</span><span>{formatPrice(order.shippingFee)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá:</span><span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-1.5">
              <span>Tổng:</span><span className="text-primary-500">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5 mb-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Package size={16} /> Sản phẩm ({order.items.length})
        </h3>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
              <img src={item.productImage || '/placeholder.png'} alt={item.productName}
                className="w-16 h-16 object-contain bg-gray-50 rounded-xl border flex-shrink-0" />
              <div className="flex-1">
                <Link to={`/san-pham/${item.productId}`}
                  className="font-medium hover:text-primary-500 transition-colors line-clamp-2 text-sm">
                  {item.productName}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  x{item.quantity} • Bảo hành {item.warrantyMonths} tháng
                </p>
              </div>
              <p className="font-bold text-sm text-gray-800 flex-shrink-0">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

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
    </div>
  )
}
