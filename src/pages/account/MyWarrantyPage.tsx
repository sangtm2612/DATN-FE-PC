import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { serviceRequestService } from '@/services/serviceRequestService'
import type { Warranty, ServiceRequest, ServiceRequestStatus } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Wrench, X, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_INFO: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  active:     { label: 'Còn hiệu lực',   icon: CheckCircle,  color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  expired:    { label: 'Hết hạn',         icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50 border-red-200' },
  voided:     { label: 'Mất bảo hành',   icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  in_service: { label: 'Đang sửa chữa', icon: Clock,         color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
}

const SR_STATUS_LABEL: Record<ServiceRequestStatus, { label: string; color: string }> = {
  received:     { label: 'Đã tiếp nhận',   color: 'bg-gray-100 text-gray-600' },
  diagnosing:   { label: 'Đang chẩn đoán', color: 'bg-blue-100 text-blue-600' },
  repairing:    { label: 'Đang sửa chữa',  color: 'bg-yellow-100 text-yellow-700' },
  waiting_part: { label: 'Chờ linh kiện',  color: 'bg-orange-100 text-orange-600' },
  done:         { label: 'Hoàn thành',     color: 'bg-green-100 text-green-700' },
  returned:     { label: 'Đã trả máy',     color: 'bg-primary-100 text-primary-600' },
}

export default function MyWarrantyPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number | ''>('')
  const [productName, setProductName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [issueDesc, setIssueDesc] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const qc = useQueryClient()

  const { data: warranties, isLoading } = useQuery({
    queryKey: ['my-warranties'],
    queryFn: () => api.get<{ data: Warranty[] }>('/warranties/my').then(r => r.data.data || []),
  })

  const { data: serviceRequests } = useQuery({
    queryKey: ['my-service-requests'],
    queryFn: () => serviceRequestService.getMy().then(r => r.data.data || []),
  })

  const openForm = (warrantyId?: number) => {
    setSelectedWarrantyId(warrantyId ?? '')
    setProductName('')
    setSerialNumber('')
    setIssueDesc('')
    setMediaUrls([])
    setShowForm(true)
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (mediaUrls.length + files.length > 5) {
      toast.error('Tối đa 5 ảnh/video')
      return
    }
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await api.post<{ data: { url: string } }>('/upload/image', formData)
        setMediaUrls(prev => [...prev, res.data.data.url])
      }
    } finally {
      setUploading(false)
    }
  }

  const submitRequest = useMutation({
    mutationFn: () => serviceRequestService.create({
      warrantyId: selectedWarrantyId || undefined,
      productName: selectedWarrantyId ? undefined : productName,
      serialNumber: selectedWarrantyId ? undefined : serialNumber,
      issueDesc,
      mediaUrls,
    }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Đã gửi yêu cầu sửa chữa')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['my-service-requests'] })
    },
  })

  const approveRepair = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      serviceRequestService.approveRepair(id, approved),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Đã cập nhật')
      qc.invalidateQueries({ queryKey: ['my-service-requests'] })
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield size={20} className="text-primary-500" /> Bảo hành của tôi
        </h2>
        <button onClick={() => openForm()} className="btn-primary flex items-center gap-2 text-sm">
          <Wrench size={15} /> Yêu cầu sửa chữa
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_,i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : !warranties?.length ? (
        <div className="text-center py-12 text-gray-400">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có thông tin bảo hành nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {warranties.map(w => {
            const info = STATUS_INFO[w.status] || STATUS_INFO.active
            const Icon = info.icon
            return (
              <div key={w.id} className={`card p-4 border ${info.bg}`}>
                <div className="flex items-center gap-4">
                  {(w.product as any)?.thumbnail && (
                    <img src={(w.product as any).thumbnail} alt=""
                      className="w-16 h-16 object-contain bg-white rounded-lg border flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{(w.product as any)?.name || 'Sản phẩm'}</p>
                    {w.serialNumber && (
                      <p className="text-xs text-gray-500 mt-0.5">Serial: <span className="font-mono">{w.serialNumber}</span></p>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 mt-2 text-xs text-gray-500">
                      <span>Ngày mua: {formatDate(w.purchaseDate, 'DD/MM/YYYY')}</span>
                      <span>Hết hạn: {formatDate(w.warrantyExpiresAt, 'DD/MM/YYYY')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 text-sm font-semibold ${info.color}`}>
                      <Icon size={16} />
                      <span className="hidden sm:block">{info.label}</span>
                    </div>
                    <button onClick={() => openForm(w.id)} className="text-xs text-primary-500 hover:underline">
                      Yêu cầu sửa chữa
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Danh sách yêu cầu sửa chữa */}
      {!!serviceRequests?.length && (
        <div className="mt-8">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Wrench size={18} className="text-primary-500" /> Yêu cầu sửa chữa của tôi
          </h3>
          <div className="space-y-3">
            {serviceRequests.map(sr => {
              const st = SR_STATUS_LABEL[sr.status]
              return (
                <div key={sr.id} className="card p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-semibold text-primary-600 text-sm">{sr.serviceCode}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{sr.productName}</p>
                  <p className="text-xs text-gray-500 mt-1">{sr.issueDesc}</p>
                  {sr.diagnosis && (
                    <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">
                      <strong>Chẩn đoán:</strong> {sr.diagnosis}
                    </p>
                  )}
                  {sr.repairCost > 0 && (
                    <div className="mt-2 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                      <span className="text-sm">
                        Báo giá sửa chữa: <strong className="text-primary-600">{formatPrice(sr.repairCost)}</strong>
                      </span>
                      {sr.customerApprovedRepair == null ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveRepair.mutate({ id: sr.id, approved: true })}
                            disabled={approveRepair.isPending}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg font-medium">
                            Duyệt
                          </button>
                          <button
                            onClick={() => approveRepair.mutate({ id: sr.id, approved: false })}
                            disabled={approveRepair.isPending}
                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className={`text-xs font-medium ${sr.customerApprovedRepair ? 'text-green-600' : 'text-red-500'}`}>
                          {sr.customerApprovedRepair ? 'Đã duyệt' : 'Đã từ chối'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal yêu cầu sửa chữa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg">Gửi yêu cầu sửa chữa</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chọn bảo hành có sẵn</label>
                <select
                  value={selectedWarrantyId}
                  onChange={e => setSelectedWarrantyId(e.target.value ? +e.target.value : '')}
                  className="input"
                >
                  <option value="">-- Nhập thông tin sản phẩm thủ công --</option>
                  {warranties?.map(w => (
                    <option key={w.id} value={w.id}>{(w.product as any)?.name} {w.serialNumber ? `(${w.serialNumber})` : ''}</option>
                  ))}
                </select>
              </div>

              {!selectedWarrantyId && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
                    <input value={productName} onChange={e => setProductName(e.target.value)} className="input" placeholder="VD: Chuột Logitech G102" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Số serial (nếu có)</label>
                    <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="input" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Mô tả lỗi gặp phải *</label>
                <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} className="input" rows={3}
                  placeholder="VD: Máy không lên nguồn, phát ra tiếng kêu lạ..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ảnh/video lỗi (tối đa 5 file)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                      <button
                        onClick={() => setMediaUrls(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                  {mediaUrls.length < 5 && (
                    <label className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer text-gray-400 hover:text-primary-500 hover:border-primary-300">
                      <Upload size={18} />
                      <input type="file" accept="image/*" multiple className="hidden"
                        disabled={uploading}
                        onChange={e => handleUpload(e.target.files)} />
                    </label>
                  )}
                </div>
                {uploading && <p className="text-xs text-gray-400">Đang tải ảnh lên...</p>}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Hủy</button>
              <button
                onClick={() => submitRequest.mutate()}
                disabled={submitRequest.isPending || !issueDesc.trim() || (!selectedWarrantyId && !productName.trim())}
                className="btn-primary flex-1">
                {submitRequest.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
