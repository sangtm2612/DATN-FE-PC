import numeral from 'numeral'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('vi')

/** Format giá tiền VNĐ: 1.500.000đ */
export function formatPrice(value: number): string {
  return numeral(value).format('0,0') + 'đ'
}

/** Format ngày giờ */
export function formatDate(date: string | undefined, fmt = 'DD/MM/YYYY HH:mm'): string {
  if (!date) return '—'
  return dayjs(date).format(fmt)
}

export function fromNow(date: string): string {
  return dayjs(date).fromNow()
}

/** Tạo session ID cho guest cart */
export function getOrCreateSessionId(): string {
  let id = localStorage.getItem('session_id')
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2) + Date.now()
    localStorage.setItem('session_id', id)
  }
  return id
}

/** Map order status sang tiếng Việt */
export const ORDER_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Chờ xác nhận', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  confirmed:  { label: 'Đã xác nhận',  color: 'text-blue-600 bg-blue-50 border-blue-200' },
  processing: { label: 'Đang xử lý',   color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  shipping:   { label: 'Đang giao',    color: 'text-purple-600 bg-purple-50 border-purple-200' },
  delivered:  { label: 'Đã giao',      color: 'text-teal-600 bg-teal-50 border-teal-200' },
  completed:  { label: 'Hoàn thành',   color: 'text-green-600 bg-green-50 border-green-200' },
  cancelled:  { label: 'Đã hủy',       color: 'text-red-600 bg-red-50 border-red-200' },
  refunded:   { label: 'Đã hoàn tiền', color: 'text-gray-600 bg-gray-50 border-gray-200' },
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod:           'Tiền mặt khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  vnpay:         'VNPay',
  momo:          'Ví MoMo',
  zalopay:       'ZaloPay',
  installment:   'Trả góp 0%',
}

/** Truncate text */
export function truncate(str: string, n: number): string {
  return str.length > n ? str.substring(0, n - 1) + '...' : str
}

/** Build query string */
export function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  })
  return q.toString()
}
