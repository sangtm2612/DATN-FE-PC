import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface Voucher {
  id: number
  code: string
  name: string
  voucherType: 'PUBLIC' | 'PERSONAL'
  discountType: 'percent' | 'fixed_amount' | 'free_shipping'
  discountValue: number
  minOrderValue: number
  maxUsageCount: number | null
  usedCount: number
  startDate: string
  endDate: string
  isActive: boolean
  // Fields for user's vouchers
  userVoucherStatus?: 'AVAILABLE' | 'USED' | 'EXPIRED'
  assignedAt?: string
  usedAt?: string
  userVoucherExpiresAt?: string
}

export const voucherService = {
  /**
   * Lấy danh sách voucher của tôi
   */
  getMyVouchers: (status?: string) => {
    const params = status ? `?status=${status}` : ''
    return api.get<ApiResponse<Voucher[]>>(`/vouchers/my-vouchers${params}`)
  },

  /**
   * Check voucher có hợp lệ không
   */
  checkVoucher: (code: string) => 
    api.get<ApiResponse<Voucher>>(`/vouchers/check?code=${code}`),
}
