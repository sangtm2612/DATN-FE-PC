import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/axios'
import { formatPrice, formatDate, ORDER_STATUS_LABEL } from '@/lib/utils'
import type { Order } from '@/types'
import RevenueChart from '@/components/admin/RevenueChart'
import { ShoppingCart, Package, Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

type Period = 'week' | 'month' | 'year'

const PERIOD_OPTS: { value: Period; label: string }[] = [
  { value: 'week',  label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'year',  label: 'Năm' },
]

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

  const revenueChangePercent = Number(stats?.revenueChangePercent ?? 0)

  const statCards = [
    {
      label: 'Doanh thu tháng',
      value: formatPrice(stats?.monthRevenue || 0),
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: {
        text: `${revenueChangePercent >= 0 ? '+' : ''}${revenueChangePercent.toFixed(1)}% so với tháng trước`,
        variant: revenueChangePercent >= 0 ? 'growth-up' : 'growth-down',
      },
    },
    {
      label: 'Đơn hàng mới',
      value: stats?.ordersThisMonth ?? 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      trend: { text: `+${stats?.ordersToday ?? 0} đơn hôm nay`, variant: 'growth-up' },
    },
    {
      label: 'Tổng sản phẩm',
      value: stats?.totalProducts ?? 0,
      icon: Package,
      color: 'bg-purple-500',
      trend: { text: `${stats?.lowStockCount ?? 0} sắp hết hàng`, variant: 'warning' },
    },
    {
      label: 'Khách hàng',
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      color: 'bg-orange-500',
      trend: { text: `+${stats?.newCustomersThisMonth ?? 0} mới`, variant: 'growth-up' },
    },
  ] as const

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400">Cập nhật lúc {formatDate(new Date().toISOString(), 'HH:mm, DD/MM/YYYY')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${
                trend.variant === 'warning'      ? 'text-orange-500' :
                trend.variant === 'growth-down'  ? 'text-red-500' : 'text-green-600'
              }`}>
                {trend.variant === 'growth-up'   && <TrendingUp size={12} />}
                {trend.variant === 'growth-down' && <TrendingDown size={12} />}
                {trend.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Biểu đồ doanh thu</h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {PERIOD_OPTS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    period === opt.value ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <RevenueChart data={revenueChart || []} loading={chartLoading} />
        </div>

        {/* Low stock */}
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
                  <span className="truncate text-gray-700 max-w-48">{p.name}</span>
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
            Xem tất cả →
          </Link>
        </div>
        {!recentOrders?.length ? (
          <p className="text-sm text-gray-400">Chưa có đơn hàng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Trạng thái', 'Tổng tiền', 'Chi tiết'].map(h => (
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
                      <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 font-medium">
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
