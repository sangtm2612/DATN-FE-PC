import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatPrice, formatDate, ORDER_STATUS_LABEL } from '@/lib/utils'
import type { Order } from '@/types'
import Pagination from '@/components/common/Pagination'
import toast from 'react-hot-toast'
import { Eye, ChevronDown } from 'lucide-react'

const STATUS_OPTS = ['', 'pending', 'confirmed', 'processing', 'shipping', 'delivered', 'completed', 'cancelled']

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => api.get<{ data: Order[]; pagination: any }>(
      `/orders/admin/all?${status ? `status=${status}&` : ''}page=${page}&size=20`
    ).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status: s }: { id: number; status: string }) =>
      api.put(`/orders/${id}/status?status=${s}`),
    onSuccess: () => { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['admin-orders'] }) },
  })

  const orders: Order[] = data?.data || []
  const pagination = data?.pagination

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500">
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTS.slice(1).map(s => (
            <option key={s} value={s}>{ORDER_STATUS_LABEL[s]?.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày đặt', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-primary-600">{order.orderCode}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.shippingName}</p>
                  <p className="text-gray-400 text-xs">{order.shippingPhone}</p>
                </td>
                <td className="px-4 py-3 font-semibold">{formatPrice(order.totalAmount)}</td>
                <td className="px-4 py-3 capitalize">{order.paymentMethod}</td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={e => updateStatus.mutate({ id: order.id, status: e.target.value })}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer ${ORDER_STATUS_LABEL[order.status]?.color}`}
                  >
                    {STATUS_OPTS.slice(1).map(s => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]?.label}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt, 'DD/MM HH:mm')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedOrder(order)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-primary-500">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">Không có đơn hàng</div>
        )}
      </div>

      {pagination && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
