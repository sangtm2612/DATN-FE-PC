import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatPrice, formatDate, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/lib/utils'
import type { Order } from '@/types'
import Pagination from '@/components/common/Pagination'
import toast from 'react-hot-toast'
import {
  Eye, Search, X, Package, MapPin, CreditCard, Clock,
  Phone, Mail, User, FileText, Truck, CheckCircle, AlertCircle,
  ArrowRight, ShieldCheck
} from 'lucide-react'
import type { OrderHistoryEntry } from '@/types'

const STATUS_OPTS = ['', 'pending', 'confirmed', 'processing', 'shipping', 'delivered', 'completed', 'cancelled']

function useDebounce(delay: number) {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((fn: () => void) => {
    if (timer) clearTimeout(timer)
    setTimer(setTimeout(fn, delay))
  }, [timer, delay])
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const qc = useQueryClient()
  const debounce = useDebounce(400)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, keyword, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (keyword) params.set('keyword', keyword)
      params.set('page', String(page))
      params.set('size', '20')
      return api.get<{ data: Order[]; pagination: any }>(`/orders/admin/all?${params}`).then(r => r.data)
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status: s, staffNote }: { id: number; status: string; staffNote?: string }) =>
      api.put(`/orders/${id}/status?status=${s}${staffNote ? `&staffNote=${encodeURIComponent(staffNote)}` : ''}`),
    onSuccess: () => {
      toast.success('Cập nhật thành công')
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })

  const orders: Order[] = data?.data || []
  const pagination = data?.pagination

  const handleSearch = (value: string) => {
    setSearchInput(value)
    debounce(() => {
      setKeyword(value.trim())
      setPage(0)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <div className="text-sm text-gray-500">
          {pagination?.total != null ? `${pagination.total} đơn hàng` : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm theo mã đơn, SĐT, tên khách, email..."
            className="w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setKeyword(''); setPage(0) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}
          className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 min-w-[160px]">
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTS.slice(1).map(s => (
            <option key={s} value={s}>{ORDER_STATUS_LABEL[s]?.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày đặt', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                <td className="px-4 py-3 font-mono font-medium text-primary-600">{order.orderCode}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.customerName || order.shippingName}</p>
                  <p className="text-gray-400 text-xs">{order.customerPhone || order.shippingPhone}</p>
                </td>
                <td className="px-4 py-3 font-semibold">{formatPrice(order.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs">{PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ORDER_STATUS_LABEL[order.status]?.color}`}>
                    {ORDER_STATUS_LABEL[order.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(order.createdAt, 'DD/MM/YYYY HH:mm')}</td>
                <td className="px-4 py-3">
                  <button onClick={e => { e.stopPropagation(); setSelectedOrder(order) }}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-primary-500">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && <div className="text-center py-12 text-gray-400">Đang tải...</div>}
        {!isLoading && orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {keyword ? `Không tìm thấy đơn hàng cho "${keyword}"` : 'Không có đơn hàng'}
          </div>
        )}
      </div>

      {pagination && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={(status, staffNote) => {
            updateStatus.mutate({ id: selectedOrder.id, status, staffNote }, {
              onSuccess: () => setSelectedOrder(null),
            })
          }}
          isUpdating={updateStatus.isPending}
        />
      )}
    </div>
  )
}

const ACTOR_LABEL: Record<string, string> = {
  customer: 'Khách hàng', staff: 'Nhân viên',
  technician: 'Kỹ thuật viên', admin: 'Admin', system: 'Hệ thống',
}

function OrderDetailModal({ order, onClose, onUpdateStatus, isUpdating }: {
  order: Order
  onClose: () => void
  onUpdateStatus: (status: string, staffNote?: string) => void
  isUpdating: boolean
}) {
  const [newStatus, setNewStatus] = useState(order.status)
  const [staffNote, setStaffNote] = useState(order.staffNote || '')

  // Fetch chi tiết đầy đủ kèm history từ endpoint admin/detail
  const { data: detail } = useQuery({
    queryKey: ['admin-order-detail', order.id],
    queryFn: () => api.get<{ data: Order }>(`/orders/admin/${order.id}/detail`).then(r => r.data.data),
    initialData: order,
  })
  const o = detail || order

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h3 className="font-bold text-lg">Chi tiết đơn hàng</h3>
            <p className="text-sm text-gray-500 font-mono">{o.orderCode}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ORDER_STATUS_LABEL[o.status]?.color}`}>
              {ORDER_STATUS_LABEL[o.status]?.label}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Customer Info */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={16} /> Thông tin khách hàng
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-gray-400" />
                <span className="text-gray-500">Tên:</span>
                <span className="font-medium">
                  {o.customerName || o.shippingName}
                  {o.customerEmail && (
                    <span className="text-gray-400 font-normal"> - {o.customerEmail.split('@')[0]}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-gray-400" />
                <span className="text-gray-500">SĐT:</span>
                <span className="font-medium">{o.customerPhone || o.shippingPhone}</span>
              </div>
              {o.customerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{o.customerEmail}</span>
                </div>
              )}
              {o.userId && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">User ID:</span>
                  <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">#{o.userId}</span>
                </div>
              )}
            </div>
          </section>

          {/* Shipping */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MapPin size={16} /> Địa chỉ giao hàng
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
              <p className="font-medium">{o.shippingName} — {o.shippingPhone}</p>
              <p className="text-gray-600">{o.shippingAddress}, {o.shippingWard}, {o.shippingDistrict}, {o.shippingProvince}</p>
            </div>
          </section>

          {/* Items */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Package size={16} /> Sản phẩm ({o.items.length})
            </h4>
            <div className="border rounded-xl overflow-hidden">
              {o.items.map((item, i) => (
                <div key={item.id} className={`flex items-center gap-4 p-3 ${i > 0 ? 'border-t' : ''}`}>
                  {item.productImage
                    ? <img src={item.productImage} alt="" className="w-14 h-14 object-cover rounded-lg bg-gray-100" />
                    : <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center"><Package size={20} className="text-gray-300" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    {item.productSku && <p className="text-xs text-gray-400">SKU: {item.productSku}</p>}
                    {item.warrantyMonths > 0 && <p className="text-xs text-gray-400">BH: {item.warrantyMonths} tháng</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-500">x{item.quantity}</p>
                    <p className="font-semibold">{formatPrice(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CreditCard size={16} /> Thanh toán
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Phương thức</span>
                <span className="font-medium">{PAYMENT_METHOD_LABEL[o.paymentMethod] || o.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái TT</span>
                <span className={`font-medium ${o.paymentStatus === 'paid' ? 'text-green-600' : o.paymentStatus === 'failed' ? 'text-red-600' : ''}`}>
                  {o.paymentStatus === 'paid' ? 'Đã thanh toán' : o.paymentStatus === 'failed' ? 'Thất bại' : o.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Chờ thanh toán'}
                </span>
              </div>
              <hr />
              <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatPrice(o.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phí vận chuyển</span><span>{formatPrice(o.shippingFee)}</span></div>
              {o.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá {o.voucherCode && `(${o.voucherCode})`}</span>
                  <span>-{formatPrice(o.discountAmount)}</span>
                </div>
              )}
              {(o.refundAmount ?? 0) > 0 && (
                <div className="flex justify-between text-orange-600"><span>Hoàn tiền</span><span>-{formatPrice(o.refundAmount!)}</span></div>
              )}
              <hr />
              <div className="flex justify-between font-bold text-base">
                <span>Tổng cộng</span><span className="text-primary-600">{formatPrice(o.totalAmount)}</span>
              </div>
            </div>
          </section>

          {/* Audit Trail — lịch sử đầy đủ: ai làm gì lúc nào */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShieldCheck size={16} /> Lịch sử xử lý đơn hàng
            </h4>
            {o.history && o.history.length > 0 ? (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
                <div className="space-y-3">
                  {o.history.map((h, i) => {
                    const isCancelled = h.toStatus === 'cancelled'
                    const isCompleted = h.toStatus === 'completed'
                    return (
                      <div key={h.id} className="flex gap-4 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10
                          ${isCancelled ? 'bg-red-100' : isCompleted ? 'bg-green-100' : 'bg-primary-50'}`}>
                          {isCancelled
                            ? <AlertCircle size={14} className="text-red-500" />
                            : isCompleted
                            ? <CheckCircle size={14} className="text-green-500" />
                            : <ArrowRight size={14} className="text-primary-500" />
                          }
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-sm">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <div className="flex items-center gap-2">
                              {h.fromStatus && (
                                <>
                                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ORDER_STATUS_LABEL[h.fromStatus]?.color}`}>
                                    {ORDER_STATUS_LABEL[h.fromStatus]?.label}
                                  </span>
                                  <ArrowRight size={12} className="text-gray-400" />
                                </>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ORDER_STATUS_LABEL[h.toStatus]?.color}`}>
                                {ORDER_STATUS_LABEL[h.toStatus]?.label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(h.createdAt, 'DD/MM/YYYY HH:mm')}</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                            <User size={11} />
                            <span className="font-medium text-gray-700">
                              {h.performedByName
                                ? h.performedByUsername
                                  ? `${h.performedByName} - ${h.performedByUsername}`
                                  : h.performedByName
                                : 'Hệ thống'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                              ${h.actorType === 'staff' || h.actorType === 'admin' ? 'bg-blue-50 text-blue-600'
                                : h.actorType === 'customer' ? 'bg-gray-100 text-gray-600'
                                : 'bg-gray-100 text-gray-500'}`}>
                              {ACTOR_LABEL[h.actorType] ?? h.actorType}
                            </span>
                          </div>
                          {h.note && <p className="mt-1 text-xs text-gray-600 italic">"{h.note}"</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Chưa có lịch sử (đơn hàng cũ trước khi cập nhật hệ thống)</p>
            )}
          </section>

          {/* Notes */}
          {(o.note || o.cancelledReason) && (
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={16} /> Ghi chú
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                {o.note && <p><span className="text-gray-500">Ghi chú KH:</span> {o.note}</p>}
                {o.cancelledReason && <p className="text-red-600"><span className="text-gray-500">Lý do hủy:</span> {o.cancelledReason}</p>}
              </div>
            </section>
          )}

          {/* Update Status */}
          <section className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Cập nhật trạng thái</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Trạng thái mới</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-primary-500">
                  {STATUS_OPTS.slice(1).map(s => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]?.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ghi chú nội bộ (lưu vào lịch sử)</label>
                <textarea value={staffNote} onChange={e => setStaffNote(e.target.value)}
                  rows={2} placeholder="VD: Đã liên hệ khách, sẽ giao ngày mai..."
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-primary-500 resize-none" />
              </div>
              <button
                disabled={isUpdating || newStatus === o.status}
                onClick={() => onUpdateStatus(newStatus, staffNote || undefined)}
                className="btn-primary w-full disabled:opacity-50">
                {isUpdating ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
