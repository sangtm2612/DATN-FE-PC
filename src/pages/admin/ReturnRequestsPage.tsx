import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { returnRequestService } from '@/services/returnRequestService'
import type { ReturnRequest, ReturnRequestStatus } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Eye, X } from 'lucide-react'

const STATUS_OPTS: ReturnRequestStatus[] = ['pending', 'reviewing', 'approved', 'rejected', 'completed']
const STATUS_LABEL: Record<ReturnRequestStatus, string> = {
  pending: 'Chờ xử lý', reviewing: 'Đang xem xét', approved: 'Đã duyệt',
  rejected: 'Đã từ chối', completed: 'Đã hoàn tất',
}
const REASON_LABEL: Record<string, string> = {
  defective: 'Sản phẩm bị lỗi', wrong_item: 'Giao sai sản phẩm',
  damaged_delivery: 'Hư hỏng khi vận chuyển', not_satisfied: 'Không hài lòng',
}

export default function AdminReturnRequestsPage() {
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<ReturnRequest | null>(null)
  const [staffNote, setStaffNote] = useState('')
  const [resolution, setResolution] = useState<'exchange' | 'refund'>('refund')
  const [refundAmount, setRefundAmount] = useState('')
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['admin-return-requests', status],
    queryFn: () => returnRequestService.getAdminAll(status || undefined).then(r => r.data.data || []),
  })

  const openDetail = (rr: ReturnRequest) => {
    setSelected(rr)
    setStaffNote(rr.staffNote || '')
    setResolution(rr.resolution || 'refund')
    setRefundAmount(rr.refundAmount ? String(rr.refundAmount) : '')
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-return-requests'] })

  const review = useMutation({
    mutationFn: () => returnRequestService.review(selected!.id, staffNote || undefined),
    onSuccess: (res) => { toast.success(res.data.message || 'Đã cập nhật'); invalidate(); setSelected(null) },
  })

  const decide = useMutation({
    mutationFn: (decision: 'approved' | 'rejected') => returnRequestService.decide(selected!.id, {
      decision,
      resolution: decision === 'approved' ? resolution : undefined,
      refundAmount: decision === 'approved' && resolution === 'refund' ? Number(refundAmount) : undefined,
      staffNote: staffNote || undefined,
    }),
    onSuccess: (res) => { toast.success(res.data.message || 'Đã cập nhật'); invalidate(); setSelected(null) },
  })

  const complete = useMutation({
    mutationFn: () => returnRequestService.complete(selected!.id),
    onSuccess: (res) => { toast.success(res.data.message || 'Đã hoàn tất'); invalidate(); setSelected(null) },
  })

  const requests: ReturnRequest[] = data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Yêu cầu đổi/trả hàng</h1>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500">
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Mã YC', 'Đơn hàng', 'Khách hàng', 'Lý do', 'Trạng thái', 'Ngày gửi', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests.map(rr => (
              <tr key={rr.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-primary-600">{rr.returnCode}</td>
                <td className="px-4 py-3 font-mono text-gray-500">{rr.orderCode}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{rr.userName}</p>
                  <p className="text-gray-400 text-xs">{rr.userPhone}</p>
                </td>
                <td className="px-4 py-3">{REASON_LABEL[rr.reasonType] || rr.reasonType}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {STATUS_LABEL[rr.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(rr.createdAt, 'DD/MM HH:mm')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(rr)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-primary-500">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="text-center py-12 text-gray-400">Không có yêu cầu đổi/trả nào</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg font-mono">{selected.returnCode}</h3>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
                <p><strong>Đơn hàng:</strong> {selected.orderCode}</p>
                <p><strong>Khách hàng:</strong> {selected.userName} ({selected.userPhone})</p>
                <p><strong>Lý do:</strong> {REASON_LABEL[selected.reasonType] || selected.reasonType}</p>
                {selected.reasonDetail && <p><strong>Chi tiết:</strong> {selected.reasonDetail}</p>}
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Sản phẩm yêu cầu đổi/trả</p>
                <div className="space-y-1">
                  {selected.items.map(i => (
                    <p key={i.orderItemId} className="text-sm text-gray-600">
                      {i.productName} x{i.quantity}
                    </p>
                  ))}
                </div>
              </div>

              {!!selected.mediaUrls?.length && (
                <div className="flex flex-wrap gap-2">
                  {selected.mediaUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                    </a>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Ghi chú của nhân viên</label>
                <textarea value={staffNote} onChange={e => setStaffNote(e.target.value)} className="input" rows={2} />
              </div>

              {selected.status === 'pending' && (
                <button onClick={() => review.mutate()} disabled={review.isPending} className="btn-primary w-full">
                  {review.isPending ? 'Đang xử lý...' : 'Bắt đầu xem xét'}
                </button>
              )}

              {selected.status === 'reviewing' && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hướng xử lý nếu duyệt</label>
                    <select value={resolution} onChange={e => setResolution(e.target.value as 'exchange' | 'refund')} className="input">
                      <option value="refund">Hoàn tiền</option>
                      <option value="exchange">Đổi hàng</option>
                    </select>
                  </div>
                  {resolution === 'refund' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Số tiền hoàn</label>
                      <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="input" placeholder="0" />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => decide.mutate('rejected')} disabled={decide.isPending}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">
                      Từ chối
                    </button>
                    <button onClick={() => decide.mutate('approved')}
                      disabled={decide.isPending || (resolution === 'refund' && !refundAmount)}
                      className="flex-1 btn-primary">
                      Duyệt yêu cầu
                    </button>
                  </div>
                </div>
              )}

              {selected.status === 'approved' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Hướng xử lý: <strong>{selected.resolution === 'refund' ? `Hoàn tiền ${formatPrice(selected.refundAmount || 0)}` : 'Đổi hàng'}</strong>
                  </p>
                  <button onClick={() => complete.mutate()} disabled={complete.isPending} className="btn-primary w-full">
                    {complete.isPending ? 'Đang xử lý...' : 'Hoàn tất yêu cầu'}
                  </button>
                </div>
              )}

              {selected.status === 'completed' && (
                <p className="text-sm text-green-600 font-medium border-t pt-4">
                  Đã hoàn tất {selected.resolution === 'refund' ? `— hoàn tiền ${formatPrice(selected.refundAmount || 0)}` : '— đổi hàng'}
                </p>
              )}
              {selected.status === 'rejected' && (
                <p className="text-sm text-red-500 font-medium border-t pt-4">Yêu cầu đã bị từ chối</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
