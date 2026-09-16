import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { voucherService, type Voucher } from '@/services/voucherService'
import { formatDate } from '@/lib/utils'
import { Ticket, Copy, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'available', label: 'Có thể dùng' },
  { value: 'used', label: 'Đã dùng' },
  { value: 'expired', label: 'Hết hạn' },
]

export default function MyVouchersPage() {
  const [status, setStatus] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-vouchers', status],
    queryFn: () => voucherService.getMyVouchers(status || undefined).then(r => r.data),
  })

  const vouchers = data?.data || []

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Đã copy mã voucher!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getDiscountText = (voucher: Voucher) => {
    if (voucher.discountType === 'percent') {
      return `Giảm ${voucher.discountValue}%`
    } else if (voucher.discountType === 'fixed_amount') {
      return `Giảm ${voucher.discountValue.toLocaleString()}đ`
    } else {
      return 'Miễn phí vận chuyển'
    }
  }

  const getStatusBadge = (voucher: Voucher) => {
    const voucherStatus = voucher.userVoucherStatus || 'AVAILABLE'
    
    switch (voucherStatus) {
      case 'AVAILABLE':
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-300">Có thể dùng</span>
      case 'USED':
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-300">Đã sử dụng</span>
      case 'EXPIRED':
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300">Hết hạn</span>
      default:
        return null
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Voucher của tôi</h2>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {STATUS_TABS.map(tab => (
          <button key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${status === tab.value ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Ticket size={48} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có voucher nào</p>
          <p className="text-sm mt-1">Voucher sẽ được tặng khi bạn tham gia các chương trình khuyến mãi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map(voucher => {
            const isAvailable = voucher.userVoucherStatus === 'AVAILABLE'
            const isUsed = voucher.userVoucherStatus === 'USED'
            
            return (
              <div key={voucher.id} 
                className={`card overflow-hidden ${!isAvailable ? 'opacity-60' : ''}`}>
                <div className="flex">
                  {/* Left side - Voucher info */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{voucher.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getDiscountText(voucher)}
                          {voucher.minOrderValue > 0 && (
                            <span> · Đơn tối thiểu {voucher.minOrderValue.toLocaleString()}đ</span>
                          )}
                        </p>
                      </div>
                      {getStatusBadge(voucher)}
                    </div>

                    {/* Voucher code */}
                    <div className="flex items-center gap-2 mt-3 mb-3">
                      <code className="bg-gray-100 px-3 py-1.5 rounded-lg font-mono text-sm font-bold text-primary-500 border border-gray-200">
                        {voucher.code}
                      </code>
                      <button
                        onClick={() => copyCode(voucher.code)}
                        disabled={!isAvailable}
                        className="text-primary-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Copy mã"
                      >
                        {copiedCode === voucher.code ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>HSD: {formatDate(voucher.userVoucherExpiresAt || voucher.endDate, 'DD/MM/YYYY')}</span>
                      </div>
                      {voucher.assignedAt && (
                        <span>Nhận: {formatDate(voucher.assignedAt, 'DD/MM/YYYY')}</span>
                      )}
                      {isUsed && voucher.usedAt && (
                        <span className="text-gray-400">Đã dùng: {formatDate(voucher.usedAt, 'DD/MM/YYYY')}</span>
                      )}
                    </div>

                    {/* Voucher type badge */}
                    {voucher.voucherType === 'PERSONAL' && (
                      <div className="mt-3">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          Voucher cá nhân
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right side - Decorative */}
                  <div className="w-24 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center relative">
                    <div className="absolute -left-3 w-6 h-6 bg-gray-50 rounded-full"></div>
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full"></div>
                    <div className="absolute -left-3 bottom-0 w-6 h-6 bg-gray-50 rounded-full"></div>
                    <Ticket size={32} className="text-white/30" />
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
