import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceRequestService } from '@/services/serviceRequestService'
import type { ServiceRequest, ServiceRequestStatus } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Eye, X } from 'lucide-react'

const STATUS_OPTS: ServiceRequestStatus[] = ['received', 'diagnosing', 'repairing', 'waiting_part', 'done', 'returned']
const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  received: 'Đã tiếp nhận', diagnosing: 'Đang chẩn đoán', repairing: 'Đang sửa chữa',
  waiting_part: 'Chờ linh kiện', done: 'Hoàn thành', returned: 'Đã trả máy',
}

export default function AdminServiceRequestsPage() {
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<ServiceRequest | null>(null)
  const [diagnosis, setDiagnosis] = useState('')
  const [repairCost, setRepairCost] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [newStatus, setNewStatus] = useState<ServiceRequestStatus>('received')
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['admin-service-requests', status],
    queryFn: () => serviceRequestService.getAdminAll(status || undefined).then(r => r.data.data || []),
  })

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => serviceRequestService.getTechnicians().then(r => r.data.data || []),
  })

  const openDetail = (sr: ServiceRequest) => {
    setSelected(sr)
    setDiagnosis(sr.diagnosis || '')
    setRepairCost(sr.repairCost ? String(sr.repairCost) : '')
    setTechnicianId(sr.technicianId ? String(sr.technicianId) : '')
    setNewStatus(sr.status)
  }

  const update = useMutation({
    mutationFn: () => serviceRequestService.updateStatus(selected!.id, {
      status: newStatus,
      diagnosis: diagnosis || undefined,
      repairCost: repairCost ? Number(repairCost) : undefined,
      technicianId: technicianId ? Number(technicianId) : undefined,
    }),
    onSuccess: () => {
      toast.success('Đã cập nhật')
      qc.invalidateQueries({ queryKey: ['admin-service-requests'] })
      setSelected(null)
    },
  })

  const requests: ServiceRequest[] = data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Yêu cầu sửa chữa</h1>
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
              {['Mã YC', 'Khách hàng', 'Sản phẩm', 'Trạng thái', 'Báo giá', 'Ngày gửi', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests.map(sr => (
              <tr key={sr.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-primary-600">{sr.serviceCode}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{sr.userName}</p>
                  <p className="text-gray-400 text-xs">{sr.userPhone}</p>
                </td>
                <td className="px-4 py-3">{sr.productName}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {STATUS_LABEL[sr.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{sr.repairCost > 0 ? formatPrice(sr.repairCost) : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(sr.createdAt, 'DD/MM HH:mm')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(sr)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-primary-500">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="text-center py-12 text-gray-400">Không có yêu cầu sửa chữa nào</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg font-mono">{selected.serviceCode}</h3>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
                <p><strong>Khách hàng:</strong> {selected.userName} ({selected.userPhone})</p>
                <p><strong>Sản phẩm:</strong> {selected.productName} {selected.serialNumber ? `- ${selected.serialNumber}` : ''}</p>
                <p><strong>Mô tả lỗi:</strong> {selected.issueDesc}</p>
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
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value as ServiceRequestStatus)} className="input">
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kỹ thuật viên phụ trách</label>
                <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="input">
                  <option value="">-- Chưa gán --</option>
                  {technicians?.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chẩn đoán</label>
                <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="input" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Báo giá sửa chữa (ngoài bảo hành)</label>
                <input type="number" value={repairCost} onChange={e => setRepairCost(e.target.value)} className="input" placeholder="0" />
              </div>
              {selected.customerApprovedRepair != null && (
                <p className={`text-sm font-medium ${selected.customerApprovedRepair ? 'text-green-600' : 'text-red-500'}`}>
                  Khách hàng đã {selected.customerApprovedRepair ? 'duyệt' : 'từ chối'} báo giá
                </p>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setSelected(null)} className="btn-outline flex-1">Hủy</button>
              <button onClick={() => update.mutate()} disabled={update.isPending} className="btn-primary flex-1">
                {update.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
