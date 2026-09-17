import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { serviceRequestService } from '@/services/serviceRequestService'
import type { Warranty, ServiceRequest, ServiceRequestStatus } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Wrench, X, Upload, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_INFO: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  active:     { label: 'Còn hiệu lực',   icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  expired:    { label: 'Hết hạn',         icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
  voided:     { label: 'Mất bảo hành',   icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  in_service: { label: 'Đang sửa chữa',  icon: Clock,         color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
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
  const [warrantyFilter, setWarrantyFilter] = useState('')
  const [srFilter, setSrFilter] = useState('')
  const srRef = useRef<HTMLDivElement>(null)
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

  const openFormFromWarranty = (warrantyId: number) => {
    openForm(warrantyId)
    setTimeout(() => srRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (mediaUrls.length + files.length > 5) { toast.error('Tối đa 5 ảnh/video'); return }
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
    <div className="space-y-8">

      {/* ── BLOCK 1: Thẻ bảo hành ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield size={20} className="text-primary-500" /> Thẻ bảo hành
          </h2>
          <span className="text-xs text-gray-400">{warranties?.length ?? 0} sản phẩm</span>
        </div>

        {/* Filter tabs bảo hành */}
        {!!warranties?.length && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {[
              { key: '', label: 'Tất cả' },
              { key: 'active',     label: 'Còn hiệu lực' },
              { key: 'in_service', label: 'Đang sửa' },
              { key: 'expired',    label: 'Hết hạn' },
              { key: 'voided',     label: 'Mất bảo hành' },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => setWarrantyFilter(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
                  ${warrantyFilter === tab.key
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-500'}`}
              >
                {tab.label}
                {tab.key && (
                  <span className="ml-1 opacity-70">
                    ({warranties.filter(w => w.status === tab.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : !warranties?.length ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
            <Shield size={36} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm">Chưa có thẻ bảo hành nào</p>
            <p className="text-xs mt-1">Thẻ được cấp tự động sau khi nhận hàng</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warranties.filter(w => !warrantyFilter || w.status === warrantyFilter).map(w => {
              const info = STATUS_INFO[w.status] || STATUS_INFO.active
              const Icon = info.icon
              const canRequest = w.status === 'active' || w.status === 'in_service'
              return (
                <div key={w.id} className={`rounded-xl border p-4 ${info.bg}`}>
                  <div className="flex items-center gap-4">
                    {(w.product as any)?.thumbnail && (
                      <img src={(w.product as any).thumbnail} alt=""
                        className="w-16 h-16 object-contain bg-white rounded-lg border flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{(w.product as any)?.name || 'Sản phẩm'}</p>
                      <div className="grid grid-cols-2 gap-x-4 mt-1.5 text-xs text-gray-500">
                        <span>Ngày mua: <span className="font-medium text-gray-700">{formatDate(w.purchaseDate, 'DD/MM/YYYY')}</span></span>
                        <span>Hết hạn: <span className="font-medium text-gray-700">{formatDate(w.warrantyExpiresAt, 'DD/MM/YYYY')}</span></span>
                        <span className="col-span-2">Thời hạn: <span className="font-medium text-gray-700">{w.warrantyMonths} tháng</span></span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className={`flex items-center gap-1.5 text-sm font-semibold ${info.color}`}>
                        <Icon size={15} />
                        <span>{info.label}</span>
                      </div>
                      {canRequest && (
                        <button
                          onClick={() => openFormFromWarranty(w.id)}
                          className="text-xs flex items-center gap-1 text-primary-500 hover:text-primary-600 font-medium"
                        >
                          <Wrench size={12} /> Yêu cầu sửa chữa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-200" />

      {/* ── BLOCK 2: Yêu cầu sửa chữa ── */}
      <section ref={srRef}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wrench size={20} className="text-orange-500" /> Yêu cầu sửa chữa
          </h2>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Tạo yêu cầu mới
          </button>
        </div>

        {/* Filter tabs yêu cầu sửa chữa */}
        {!!serviceRequests?.length && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {[
              { key: '', label: 'Tất cả' },
              { key: 'received',     label: 'Đã tiếp nhận' },
              { key: 'diagnosing',   label: 'Đang chẩn đoán' },
              { key: 'repairing',    label: 'Đang sửa' },
              { key: 'waiting_part', label: 'Chờ linh kiện' },
              { key: 'done',         label: 'Hoàn thành' },
              { key: 'returned',     label: 'Đã trả máy' },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => setSrFilter(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
                  ${srFilter === tab.key
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500'}`}
              >
                {tab.label}
                {tab.key && (
                  <span className="ml-1 opacity-70">
                    ({serviceRequests.filter(sr => sr.status === tab.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {!serviceRequests?.length ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
            <Wrench size={36} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm">Chưa có yêu cầu sửa chữa nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {serviceRequests.filter(sr => !srFilter || sr.status === srFilter).map(sr => {
              const st = SR_STATUS_LABEL[sr.status]
              return (
                <div key={sr.id} className="rounded-xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="font-mono font-semibold text-primary-600 text-sm">{sr.serviceCode}</span>
                      <p className="font-medium text-gray-800 text-sm mt-0.5">{sr.productName}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{sr.issueDesc}</p>
                  {sr.mediaUrls && sr.mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {sr.mediaUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`ảnh ${i + 1}`}
                            className="w-14 h-14 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}
                  {sr.diagnosis && (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-700">
                      <span className="font-medium">Chẩn đoán: </span>{sr.diagnosis}
                    </div>
                  )}
                  {sr.repairCost > 0 && (
                    <div className="mt-2 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                      <span className="text-sm">
                        Báo giá: <strong className="text-primary-600">{formatPrice(sr.repairCost)}</strong>
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
        )}
      </section>

      {/* Modal yêu cầu sửa chữa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Wrench size={18} className="text-orange-500" /> Gửi yêu cầu sửa chữa
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sản phẩm bảo hành</label>
                <select
                  value={selectedWarrantyId}
                  onChange={e => setSelectedWarrantyId(e.target.value ? +e.target.value : '')}
                  className="input"
                >
                  <option value="">-- Nhập thông tin thủ công --</option>
                  {warranties?.map(w => (
                    <option key={w.id} value={w.id}>{(w.product as any)?.name}</option>
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
