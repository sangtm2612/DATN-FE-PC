import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '@/services/orderService'
import { formatPrice, formatDate, ORDER_STATUS_LABEL } from '@/lib/utils'
import Pagination from '@/components/common/Pagination'
import { Package, ChevronRight, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { value: '',                label: 'Tất cả' },
  { value: 'pending_deposit', label: 'Chờ đặt cọc' },
  { value: 'pending',         label: 'Chờ xác nhận' },
  { value: 'confirmed',       label: 'Đã xác nhận' },
  { value: 'shipping',        label: 'Đang giao' },
  { value: 'completed',       label: 'Hoàn thành' },
  { value: 'cancelled',       label: 'Đã hủy' },
]

// Màu viền trái theo trạng thái
const STATUS_BORDER: Record<string, string> = {
  pending_deposit: 'border-l-orange-400',
  pending:         'border-l-yellow-400',
  confirmed:       'border-l-blue-400',
  processing:      'border-l-indigo-400',
  shipping:        'border-l-purple-400',
  delivered:       'border-l-teal-400',
  completed:       'border-l-green-500',
  cancelled:       'border-l-red-400',
  refunded:        'border-l-gray-400',
}

export default function OrderHistoryPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', status, page],
    queryFn: () => orderService.getMyOrders(status || undefined, page, 10).then(r => r.data),
  })

  const cancelOrder = useMutation({
    mutationFn: (id: number) => orderService.cancel(id),
    onSuccess: () => { toast.success('Hủy đơn hàng thành công'); qc.invalidateQueries({ queryKey: ['my-orders'] }) },
  })

  const orders = data?.data || []
  const pagination = data?.pagination

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Đơn hàng của tôi</h2>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5">
        {STATUS_TABS.map(tab => (
          <button key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(0) }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border
              ${status === tab.value
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const statusInfo = ORDER_STATUS_LABEL[order.status]
            const borderColor = STATUS_BORDER[order.status] || 'border-l-gray-300'
            return (
              <div key={order.id}
                className={`bg-white rounded-xl border border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">{order.orderCode}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatDate(order.createdAt, 'DD/MM/YYYY HH:mm')}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo?.color}`}>
                    {statusInfo?.label}
                  </span>
                </div>

                {/* Product list */}
                <div className="px-4 py-3 space-y-2">
                  {order.items.slice(0, 2).map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.productImage || '/placeholder.png'} alt={item.productName}
                        className="w-10 h-10 object-contain bg-gray-50 rounded-lg border flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-400">x{item.quantity} · {formatPrice(item.unitPrice)}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-gray-400 pl-13">+{order.items.length - 2} sản phẩm khác</p>
                  )}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{order.items.length} sản phẩm · Tổng:</span>
                      <span className="font-bold text-primary-500">{formatPrice(order.totalAmount)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Tag size={10} className="text-green-500" />
                        <span className="text-xs text-green-600 font-medium">
                          Tiết kiệm {formatPrice(order.discountAmount)}
                          {order.voucherCode && ` (${order.voucherCode})`}
                        </span>
                      </div>
                    )}
                    {(order.depositAmount ?? 0) > 0 && (
                      <p className="text-xs mt-0.5">
                        <span className={order.depositPaid ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>
                          {order.depositPaid ? 'Đã cọc' : 'Cọc'}: {formatPrice(order.depositAmount!)}
                        </span>
                        {!order.depositPaid && <span className="text-gray-400"> · Còn: {formatPrice(order.remainingAmount ?? 0)}</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {(order.status === 'pending' || order.status === 'pending_deposit') && (
                      <button
                        onClick={() => cancelOrder.mutate(order.id)}
                        className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >Hủy đơn</button>
                    )}
                    <Link to={`/account/orders/${order.id}`}
                      className="text-xs bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium">
                      Chi tiết <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pagination && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
