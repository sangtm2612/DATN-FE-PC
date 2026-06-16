import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import type { Warranty } from '@/types'
import { Search, Shield, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

const STATUS_INFO: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  active:     { label: 'Còn hiệu lực',         icon: CheckCircle, color: 'text-green-500' },
  expired:    { label: 'Hết hạn bảo hành',      icon: XCircle,     color: 'text-red-500' },
  voided:     { label: 'Mất bảo hành',          icon: AlertTriangle,color: 'text-orange-500' },
  in_service: { label: 'Đang sửa chữa',         icon: Clock,       color: 'text-blue-500' },
}

export default function WarrantyPage() {
  const [serial, setSerial] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [mode, setMode] = useState<'serial' | 'order'>('serial')

  const lookup = useMutation({
    mutationFn: () => api.get<{ data: Warranty }>(
      `/warranties/lookup?${mode === 'serial' ? `serial=${serial}` : `orderCode=${orderCode}`}`
    ),
  })

  const warranty: Warranty | undefined = lookup.data?.data?.data

  return (
    <div className="container py-8 max-w-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield size={32} className="text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Tra cứu bảo hành</h1>
        <p className="text-gray-500">Tra cứu thông tin bảo hành sản phẩm đã mua tại KinhDuanPC</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
        {[
          { key: 'serial', label: 'Số Serial máy' },
          { key: 'order',  label: 'Mã đơn hàng' },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setMode(tab.key as 'serial' | 'order')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors
              ${mode === tab.key ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search form */}
      <div className="card p-6 mb-6">
        <form onSubmit={e => { e.preventDefault(); lookup.mutate() }} className="space-y-4">
          {mode === 'serial' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số Serial máy</label>
              <input
                value={serial}
                onChange={e => setSerial(e.target.value)}
                placeholder="Nhập số serial (VD: SN123456789)"
                className="input"
                required
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Serial thường được dán dưới đáy máy hoặc trong hộp sản phẩm</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
              <input
                value={orderCode}
                onChange={e => setOrderCode(e.target.value.toUpperCase())}
                placeholder="VD: HC-2026-000001"
                className="input"
                required
                autoFocus
              />
            </div>
          )}
          <button type="submit" disabled={lookup.isPending}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Search size={16} />
            {lookup.isPending ? 'Đang tra cứu...' : 'Tra cứu bảo hành'}
          </button>
        </form>
      </div>

      {/* Error */}
      {lookup.isError && (
        <div className="card p-6 text-center">
          <XCircle size={40} className="mx-auto mb-2 text-red-400" />
          <p className="text-gray-600">Không tìm thấy thông tin bảo hành.</p>
          <p className="text-sm text-gray-400 mt-1">Vui lòng kiểm tra lại số serial hoặc mã đơn hàng.</p>
          <p className="text-sm text-primary-500 mt-3">Hotline hỗ trợ: <a href="tel:19001903" className="font-bold">1900 1903</a></p>
        </div>
      )}

      {/* Result */}
      {warranty && (() => {
        const info = STATUS_INFO[warranty.status] || STATUS_INFO.active
        const Icon = info.icon
        return (
          <div className="card overflow-hidden">
            {/* Status header */}
            <div className={`p-5 ${warranty.status === 'active' ? 'bg-green-50 border-b border-green-100' : 'bg-gray-50 border-b'}`}>
              <div className="flex items-center gap-3">
                <Icon size={28} className={info.color} />
                <div>
                  <p className={`text-lg font-bold ${info.color}`}>{info.label}</p>
                  {warranty.serialNumber && (
                    <p className="text-sm text-gray-500">Serial: <span className="font-mono font-medium">{warranty.serialNumber}</span></p>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                {(warranty.product as any)?.thumbnail && (
                  <img src={(warranty.product as any).thumbnail} alt=""
                    className="w-16 h-16 object-contain bg-gray-50 rounded-lg border" />
                )}
                <div>
                  <p className="font-semibold text-gray-800">{(warranty.product as any)?.name || 'Sản phẩm'}</p>
                  <p className="text-sm text-gray-500">Bảo hành {warranty.warrantyMonths} tháng</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                {[
                  { label: 'Ngày mua',        value: formatDate(warranty.purchaseDate, 'DD/MM/YYYY') },
                  { label: 'Hết bảo hành',    value: formatDate(warranty.warrantyExpiresAt, 'DD/MM/YYYY') },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                    <p className="font-semibold text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>

              {warranty.status === 'active' && (
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                  <p className="font-medium mb-1">Quyền lợi bảo hành:</p>
                  <ul className="space-y-0.5 text-blue-600">
                    <li>• Sửa chữa miễn phí lỗi do nhà sản xuất</li>
                    <li>• Đổi mới trong 30 ngày nếu lỗi không sửa được</li>
                    <li>• Mang đến bất kỳ cửa hàng KinhDuanPC nào</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
