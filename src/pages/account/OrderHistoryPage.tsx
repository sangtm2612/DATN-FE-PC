import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '@/services/orderService'
import { formatPrice, formatDate, ORDER_STATUS_LABEL } from '@/lib/utils'
import Pagination from '@/components/common/Pagination'
import { Package, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { value: '',           label: 'Tất cả' },
  { value: 'pending',    label: 'Chờ xác nhận' },
  { value: 'confirmed',  label: 'Đã xác nhận' },
  { value: 'shipping',   label: 'Đang giao' },
  { value: 'completed',  label: 'Hoàn thành' },
  { value: 'cancelled',  label: 'Đã hủy' },
]

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
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {STATUS_TABS.map(tab => (
          <button key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(0) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${status === tab.value ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
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
            return (
              <div key={order.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-gray-800">{order.orderCode}</span>
                    <span className="text-gray-400 text-sm ml-2">• {formatDate(order.createdAt, 'DD/MM/YYYY')}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo?.color}`}>
                    {statusInfo?.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  {order.items.slice(0, 3).map(item => (
                    <img key={item.id} src={item.productImage || '/placeholder.png'}
                      alt={item.productName} className="w-12 h-12 object-contain bg-gray-50 rounded-lg border" />
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-sm text-gray-400">+{order.items.length - 3} sản phẩm</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary-500">{formatPrice(order.totalAmount)}</span>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => cancelOrder.mutate(order.id)}
                        className="text-xs text-red-500 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50"
                      >Hủy đơn</button>
                    )}
                    <Link to={`/account/orders/${order.id}`}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
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
