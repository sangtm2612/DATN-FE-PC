import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Warranty } from '@/types'
import { formatDate } from '@/lib/utils'
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

const STATUS_INFO: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  active:     { label: 'Còn hiệu lực',   icon: CheckCircle,  color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  expired:    { label: 'Hết hạn',         icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50 border-red-200' },
  voided:     { label: 'Mất bảo hành',   icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  in_service: { label: 'Đang sửa chữa', icon: Clock,         color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
}

export default function MyWarrantyPage() {
  const { data: warranties, isLoading } = useQuery({
    queryKey: ['my-warranties'],
    queryFn: () => api.get<{ data: Warranty[] }>('/warranties/my').then(r => r.data.data || []),
  })

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Shield size={20} className="text-primary-500" /> Bảo hành của tôi
      </h2>

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
                  <div className={`flex items-center gap-1.5 text-sm font-semibold flex-shrink-0 ${info.color}`}>
                    <Icon size={16} />
                    <span className="hidden sm:block">{info.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
