import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import api from '@/lib/axios'
import { formatPrice } from '@/lib/utils'
import RevenueChart from '@/components/admin/RevenueChart'
import {
  Download, TrendingUp, ShoppingCart, CheckCircle, XCircle, BarChart3,
} from 'lucide-react'

type GroupBy = 'day' | 'month'

interface RevenuePoint { label: string; revenue: number }
interface OrderRow {
  orderCode: string
  createdAt: string
  status: string
  shippingName: string
  shippingPhone: string
  paymentMethod: string
  totalAmount: number
}

const STATUS_VI: Record<string, string> = {
  pending: 'Chờ xác nhận', pending_deposit: 'Chờ cọc', confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý', shipping: 'Đang giao', delivered: 'Đã giao',
  completed: 'Hoàn thành', cancelled: 'Đã hủy', refunded: 'Hoàn tiền',
}

const PAYMENT_VI: Record<string, string> = {
  cod: 'COD', bank_transfer: 'Chuyển khoản', vnpay: 'VNPay',
  zalopay: 'ZaloPay', momo: 'MoMo', installment: 'Trả góp',
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function RevenueReportPage() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [from, setFrom] = useState(toInputDate(firstOfMonth))
  const [to, setTo]     = useState(toInputDate(today))
  const [groupBy, setGroupBy] = useState<GroupBy>('day')

  // Báo cáo tổng hợp từ /admin/stats/report
  const { data: report, isLoading } = useQuery({
    queryKey: ['revenue-report', from, to],
    queryFn: () =>
      api.get<{ data: any }>(`/admin/stats/report?from=${from}&to=${to}`)
        .then(r => r.data.data),
    enabled: !!from && !!to,
  })

  // Chart data — nhóm theo ngày hoặc tháng từ orders list
  const chartData: RevenuePoint[] = useMemo(() => {
    if (!report?.dailyRevenue) return []
    if (groupBy === 'day') return report.dailyRevenue
    // Gộp theo tháng
    const monthly: Record<string, number> = {}
    for (const { label, revenue } of report.dailyRevenue as RevenuePoint[]) {
      // label = "dd/MM" → extract month
      const parts = label.split('/')
      const key = parts.length === 2 ? `${parts[1]}/${new Date(to).getFullYear()}` : label
      monthly[key] = (monthly[key] ?? 0) + revenue
    }
    return Object.entries(monthly).map(([label, revenue]) => ({ label, revenue }))
  }, [report, groupBy, to])

  // Tổng hợp theo PTTT
  const paymentBreakdown: { name: string; revenue: number; count: number }[] =
    report?.revenueByPaymentMethod
      ? Object.entries(report.revenueByPaymentMethod).map(([k, v]: any) => ({
          name: PAYMENT_VI[k] ?? k,
          revenue: Number(v.revenue ?? v ?? 0),
          count: Number(v.count ?? 0),
        })).filter(d => d.revenue > 0).sort((a, b) => b.revenue - a.revenue)
      : []

  const totalPayment = paymentBreakdown.reduce((s, d) => s + d.revenue, 0)

  function exportExcel() {
    if (!report) return
    const wb = XLSX.utils.book_new()

    // Sheet 1: Tổng hợp
    const summaryRows = [
      ['BÁO CÁO DOANH THU TỔNG HỢP'],
      [`Kỳ báo cáo: ${from} đến ${to}`],
      [],
      ['Chỉ số', 'Giá trị'],
      ['Tổng doanh thu', report.totalRevenue],
      ['Tổng đơn hàng', report.totalOrders],
      ['Đơn hoàn thành', report.completedOrders],
      ['Đơn đã hủy', report.cancelledOrders],
      ['Giá trị đơn trung bình', report.avgOrderValue],
      ['Khách hàng mới', report.newCustomers],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp')

    // Sheet 2: Doanh thu theo ngày
    if (report.dailyRevenue?.length) {
      const headers = [['Ngày', 'Doanh thu (VNĐ)']]
      const rows = (report.dailyRevenue as RevenuePoint[]).map(r => [r.label, r.revenue])
      const wsDaily = XLSX.utils.aoa_to_sheet([...headers, ...rows])
      wsDaily['!cols'] = [{ wch: 14 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Theo ngày')
    }

    // Sheet 3: Theo phương thức thanh toán
    if (paymentBreakdown.length) {
      const headers = [['Phương thức', 'Doanh thu (VNĐ)', 'Số đơn']]
      const rows = paymentBreakdown.map(d => [d.name, d.revenue, d.count])
      const wsPayment = XLSX.utils.aoa_to_sheet([...headers, ...rows])
      wsPayment['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, wsPayment, 'Theo PTTT')
    }

    // Sheet 4: Danh sách đơn hàng
    if (report.orders?.length) {
      const headers = [['Mã đơn', 'Ngày đặt', 'Khách hàng', 'SĐT', 'Trạng thái', 'PTTT', 'Tổng tiền']]
      const rows = (report.orders as OrderRow[]).map(o => [
        o.orderCode,
        o.createdAt?.slice(0, 16).replace('T', ' ') ?? '',
        o.shippingName,
        o.shippingPhone,
        STATUS_VI[o.status] ?? o.status,
        PAYMENT_VI[o.paymentMethod] ?? o.paymentMethod,
        o.totalAmount,
      ])
      const wsOrders = XLSX.utils.aoa_to_sheet([...headers, ...rows])
      wsOrders['!cols'] = [{ wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 18 }]
      XLSX.utils.book_append_sheet(wb, wsOrders, 'Đơn hàng')
    }

    const filename = `BaoCaoDoanhThu_${from}_${to}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const kpis = [
    { label: 'Tổng doanh thu',   value: formatPrice(report?.totalRevenue ?? 0),  icon: TrendingUp,   color: 'bg-green-500' },
    { label: 'Tổng đơn hàng',    value: report?.totalOrders ?? 0,                icon: ShoppingCart, color: 'bg-blue-500'  },
    { label: 'Đơn hoàn thành',   value: report?.completedOrders ?? 0,            icon: CheckCircle,  color: 'bg-emerald-500' },
    { label: 'Đơn đã hủy',       value: report?.cancelledOrders ?? 0,            icon: XCircle,      color: 'bg-red-500'   },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo doanh thu</h1>
        <button
          onClick={exportExcel}
          disabled={!report}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold
                     hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={16} />
          Xuất Excel
        </button>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 font-medium">Từ ngày</label>
          <input type="date" value={from} max={to}
            onChange={e => setFrom(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 font-medium">Đến ngày</label>
          <input type="date" value={to} min={from} max={toInputDate(today)}
            onChange={e => setTo(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
        </div>
        {/* Preset shortcuts */}
        <div className="flex gap-2 ml-auto flex-wrap">
          {[
            { label: 'Hôm nay',   fn: () => { const d = toInputDate(today); setFrom(d); setTo(d) } },
            { label: '7 ngày',    fn: () => { setFrom(toInputDate(new Date(today.getTime() - 6*86400000))); setTo(toInputDate(today)) } },
            { label: 'Tháng này', fn: () => { setFrom(toInputDate(firstOfMonth)); setTo(toInputDate(today)) } },
            { label: '3 tháng',   fn: () => { const d = new Date(today.getFullYear(), today.getMonth() - 2, 1); setFrom(toInputDate(d)); setTo(toInputDate(today)) } },
            { label: 'Năm nay',   fn: () => { setFrom(`${today.getFullYear()}-01-01`); setTo(toInputDate(today)) } },
          ].map(({ label, fn }) => (
            <button key={label} onClick={fn}
              className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-gray-400 text-sm">Đang tải báo cáo...</div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {kpis.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5 flex items-center gap-4">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Extra KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Giá trị đơn TB</p>
              <p className="text-lg font-bold text-primary-600">{formatPrice(report?.avgOrderValue ?? 0)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Tỷ lệ hoàn thành</p>
              <p className="text-lg font-bold text-emerald-600">
                {report?.totalOrders > 0
                  ? `${Math.round(report.completedOrders / report.totalOrders * 100)}%`
                  : '—'}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Tỷ lệ hủy</p>
              <p className="text-lg font-bold text-red-500">
                {report?.totalOrders > 0
                  ? `${Math.round(report.cancelledOrders / report.totalOrders * 100)}%`
                  : '—'}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Khách hàng mới</p>
              <p className="text-lg font-bold text-blue-600">+{report?.newCustomers ?? 0}</p>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Biểu đồ doanh thu</h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {([['day', 'Theo ngày'], ['month', 'Theo tháng']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setGroupBy(v)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      groupBy === v ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-200'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <RevenueChart data={chartData} loading={false} />
          </div>

          {/* Payment breakdown */}
          {paymentBreakdown.length > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-500" />
                Doanh thu theo phương thức thanh toán
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {paymentBreakdown.map(d => {
                    const pct = totalPayment > 0 ? Math.round(d.revenue / totalPayment * 100) : 0
                    return (
                      <div key={d.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{d.name}</span>
                          <span className="text-gray-500">{pct}% &nbsp;·&nbsp; {d.count} đơn</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full">
                          <div className="h-2 bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatPrice(d.revenue)}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Phương thức', 'Số đơn', 'Doanh thu', 'Tỷ lệ'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paymentBreakdown.map(d => (
                        <tr key={d.name} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{d.name}</td>
                          <td className="px-3 py-2 text-gray-600">{d.count}</td>
                          <td className="px-3 py-2 font-semibold">{formatPrice(d.revenue)}</td>
                          <td className="px-3 py-2 text-gray-500">
                            {totalPayment > 0 ? Math.round(d.revenue / totalPayment * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Order list */}
          {report?.orders?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-bold text-lg mb-4">
                Chi tiết đơn hàng trong kỳ
                <span className="ml-2 text-sm font-normal text-gray-400">({report.orders.length} đơn)</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Mã đơn', 'Ngày đặt', 'Khách hàng', 'Trạng thái', 'PTTT', 'Tổng tiền'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(report.orders as OrderRow[]).map(order => (
                      <tr key={order.orderCode} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-primary-600">{order.orderCode}</td>
                        <td className="px-4 py-2 text-gray-500">{order.createdAt?.slice(0, 16).replace('T', ' ')}</td>
                        <td className="px-4 py-2">{order.shippingName}</td>
                        <td className="px-4 py-2 text-gray-600">{STATUS_VI[order.status] ?? order.status}</td>
                        <td className="px-4 py-2 text-gray-600">{PAYMENT_VI[order.paymentMethod] ?? order.paymentMethod}</td>
                        <td className="px-4 py-2 font-semibold">{formatPrice(order.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
