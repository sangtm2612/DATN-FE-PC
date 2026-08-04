import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { orderService } from '@/services/orderService'
import { returnRequestService } from '@/services/returnRequestService'
import { formatPrice } from '@/lib/utils'
import api from '@/lib/axios'
import { ChevronLeft, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ReturnReasonType } from '@/types'

const REASON_OPTIONS: { value: ReturnReasonType; label: string }[] = [
  { value: 'defective', label: 'Sản phẩm bị lỗi' },
  { value: 'wrong_item', label: 'Giao sai sản phẩm' },
  { value: 'damaged_delivery', label: 'Hư hỏng khi vận chuyển' },
  { value: 'not_satisfied', label: 'Không hài lòng, muốn đổi/trả' },
]

export default function ReturnRequestPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const orderId = Number(id)

  const [selectedQty, setSelectedQty] = useState<Record<number, number>>({})
  const [reasonType, setReasonType] = useState<ReturnReasonType>('defective')
  const [reasonDetail, setReasonDetail] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getDetail(orderId).then(r => r.data.data),
  })

  const toggleItem = (orderItemId: number, maxQty: number) => {
    setSelectedQty(prev => {
      const next = { ...prev }
      if (orderItemId in next) delete next[orderItemId]
      else next[orderItemId] = maxQty
      return next
    })
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

  const submit = useMutation({
    mutationFn: () => returnRequestService.create(orderId, {
      items: Object.entries(selectedQty).map(([orderItemId, quantity]) => ({
        orderItemId: Number(orderItemId), quantity,
      })),
      reasonType,
      reasonDetail: reasonDetail || undefined,
      mediaUrls,
    }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Đã gửi yêu cầu đổi/trả')
      navigate(`/account/orders/${orderId}`)
    },
  })

  if (isLoading) return <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
  if (!order) return <div className="text-center py-12 text-gray-500">Không tìm thấy đơn hàng</div>

  const hasSelection = Object.keys(selectedQty).length > 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/account/orders/${orderId}`} className="text-gray-500 hover:text-primary-500 flex items-center gap-1">
          <ChevronLeft size={16} /> {order.orderCode}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-gray-800">Yêu cầu đổi/trả</span>
      </div>

      <div className="card p-5 mb-4">
        <h3 className="font-semibold mb-3">Chọn sản phẩm cần đổi/trả</h3>
        <div className="space-y-2">
          {order.items.map(item => {
            const checked = item.id in selectedQty
            return (
              <label key={item.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${checked ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleItem(item.id, item.quantity)} className="w-4 h-4" />
                <img src={item.productImage || '/placeholder.png'} alt="" className="w-12 h-12 object-contain bg-white rounded-lg border flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-gray-400">Đã mua x{item.quantity} • {formatPrice(item.unitPrice)}</p>
                </div>
                {checked && (
                  <input
                    type="number" min={1} max={item.quantity} value={selectedQty[item.id]}
                    onClick={e => e.stopPropagation()}
                    onChange={e => setSelectedQty(prev => ({ ...prev, [item.id]: Math.min(item.quantity, Math.max(1, +e.target.value)) }))}
                    className="w-16 border rounded-lg px-2 py-1 text-sm text-center"
                  />
                )}
              </label>
            )
          })}
        </div>
      </div>

      <div className="card p-5 mb-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Lý do đổi/trả *</label>
          <select value={reasonType} onChange={e => setReasonType(e.target.value as ReturnReasonType)} className="input">
            {REASON_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
          <textarea value={reasonDetail} onChange={e => setReasonDetail(e.target.value)} className="input" rows={3}
            placeholder="Mô tả cụ thể tình trạng sản phẩm..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh/video minh chứng (tối đa 5 file)</label>
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
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploading}
                  onChange={e => handleUpload(e.target.files)} />
              </label>
            )}
          </div>
          {uploading && <p className="text-xs text-gray-400">Đang tải ảnh lên...</p>}
        </div>
      </div>

      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending || !hasSelection}
        className="btn-primary w-full sm:w-auto px-8"
      >
        {submit.isPending ? 'Đang gửi...' : 'Gửi yêu cầu đổi/trả'}
      </button>
      {!hasSelection && <p className="text-xs text-gray-400 mt-2">Vui lòng chọn ít nhất 1 sản phẩm</p>}
    </div>
  )
}
