import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/axios'
import { formatPrice, formatDate, ORDER_STATUS_LABEL } from '@/lib/utils'
import type { Order } from '@/types'
import RevenueChart from '@/components/admin/RevenueChart'
import {
  ShoppingCart, Users, TrendingUp,
  AlertTriangle, XCircle, BarChart3, Trophy,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts'

type Period = 'week' | 'month' | 'year'
const PERIOD_OPTS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
]

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:         '#f59e0b',
  pending_deposit: '#fbbf24',
  confirmed:       '#3b82f6',
  processing:      '#8b5cf6',
  shipping:        '#06b6d4',
  delivered:       '#10b981',
  completed:       '#22c55e',
  cancelled:       '#ef4444',
  refunded:        '#6b7280',
}

const PAYMENT_LABEL: Record<string, string> = {
  cod:           'COD',
  bank_transfer: 'Chuyển khoản',
  vnpay:         'VNPay',
  zalopay:       'ZaloPay',
  momo:          'MoMo',
  installment:   'Trả góp',
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('month')

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<{ data: any }>('/admin/stats').then(r => r.data.data),
  })

  const { data: revenueChart, isLoading: chartLoading } = useQuery({
    queryKey: ['admin-revenue-chart', period],
    queryFn: () => api.get<{ data: { label: string; revenue: number }[] }>(
      `/admin/revenue-chart?period=${period}`
    ).then(r => r.data.data || []),
  })

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => api.get<{ data: Order[] }>('/orders/admin/all?page=0&size=5').then(r => r.data.data || []),
  })

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get<{ data: any[] }>('/admin/products/low-stock').then(r => r.data.data || []),
  })

  const { data: topProducts } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: () => api.get<{ data: any[] }>('/admin/stats/top-products?limit=5').then(r => r.data.data || []),
  })

  const revenueChangePercent = Number(stats?.revenueChangePercent ?? 0)

  // Order status donut data
  const ordersByStatus: Record<string, number> = stats?.ordersByStatus ?? {}
  const statusPieData = Object.entries(ordersByStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: ORDER_STATUS_LABEL[k]?.label ?? k,
      value: v as number,
      color: ORDER_STATUS_COLORS[k] ?? '#9ca3af',
    }))

  // Payment method revenue bar data
  const paymentData = Object.entries(stats?.revenueByPaymentMethod ?? {})
    .map(([k, v]) => ({ name: PAYMENT_LABEL[k] ?? k, revenue: Number(v) }))
    .filter(d => d.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)

  const statCards = [
    {
      label: 'Doanh thu tháng',
      value: formatPrice(stats?.monthRevenue || 0),
      sub: `Hôm nay: ${formatPrice(stats?.todayRevenue || 0)}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: {
        text: `${revenueChangePercent >= 0 ? '+' : ''}${revenueChangePercent.toFixed(1)}% so tháng trước`,
        variant: revenueChangePercent >= 0 ? 'up' : 'down',
      },
    },
    {
      label: 'Đơn hàng tháng',
      value: stats?.ordersThisMonth ?? 0,
      sub: `Hôm nay: +${stats?.ordersToday ?? 0} đơn`,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      trend: { text: `${stats?.completedThisMonth ?? 0} hoàn tất`, variant: 'neutral' },
    },
    {
      label: 'Đã hủy tháng này',
      value: stats?.cancelledThisMonth ?? 0,
      sub: `Giá trị TB: ${formatPrice(stats?.avgOrderValue || 0)}`,
      icon: XCircle,
      color: 'bg-red-500',
      trend: { text: 'Đơn bị hủy', variant: 'down' },
    },
    {
      label: 'Khách hàng',
      value: stats?.totalCustomers ?? 0,
      sub: `Tháng này: +${stats?.newCustomersThisMonth ?? 0} mới`,
      icon: Users,
      color: 'bg-orange-500',
      trend: { text: `+${stats?.newCustomersThisMonth ?? 0} mới tháng này`, variant: 'up' },
    },
  ] as const

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400">Cập nhật lúc {formatDate(new Date().toISOString(), 'HH:mm, DD/MM/YYYY')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, sub, icon: Icon, color, trend }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Order status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Biểu đồ doanh thu</h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {PERIOD_OPTS.map(opt => (
                <button key={opt.value} onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    period === opt.value ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-200'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <RevenueChart data={revenueChart || []} loading={chartLoading} />
        </div>

        {/* Order status donut */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-500" />
            Trạng thái đơn hàng
          </h2>
          {statusPieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusPieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                    paddingAngle={2}>
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip
                    formatter={(v: number, name: string) => [v + ' đơn', name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusPieData.slice(0, 6).map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment method + Top products + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Revenue by payment method */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Doanh thu theo PTTT
          </h2>
          {paymentData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Chưa có doanh thu tháng này</p>
          ) : (
            <div className="space-y-3">
              {paymentData.map(d => {
                const total = paymentData.reduce((s, x) => s + x.revenue, 0)
                const pct = total > 0 ? Math.round(d.revenue / total * 100) : 0
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{d.name}</span>
                      <span className="text-gray-800 font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatPrice(d.revenue)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top sản phẩm bán chạy */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            Top sản phẩm bán chạy
          </h2>
          {!topProducts?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-200 text-gray-600'}`}>
                    {i + 1}
                  </span>
                  {p.thumbnail && (
                    <img src={p.thumbnail} alt="" className="w-8 h-8 object-contain rounded border bg-gray-50 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{formatPrice(p.price)}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary-600 flex-shrink-0">
                    {p.soldQty ?? 0} đã bán
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sắp hết hàng */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            Sắp hết hàng
          </h2>
          {!lowStock?.length ? (
            <p className="text-sm text-gray-400">Không có sản phẩm sắp hết hàng</p>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 8).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-gray-700 max-w-40">{p.name}</span>
                  <span className={`font-semibold ${p.stockQty <= 2 ? 'text-red-500' : 'text-orange-500'}`}>
                    Còn {p.stockQty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Đơn hàng gần đây</h2>
          <Link to="/admin/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Xem tất cả &rarr;
          </Link>
        </div>
        {!recentOrders?.length ? (
          <p className="text-sm text-gray-400">Chưa có đơn hàng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Trạng thái', 'Tổng tiền', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-primary-600">{order.orderCode}</td>
                    <td className="px-4 py-3 text-gray-700">{order.shippingName}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt, 'DD/MM HH:mm')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${ORDER_STATUS_LABEL[order.status]?.color}`}>
                        {ORDER_STATUS_LABEL[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 font-medium text-xs">
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
