import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Package, Users, TrendingUp, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<{ data: any }>('/admin/stats').then(r => r.data.data),
  })

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get<{ data: any[] }>('/products/low-stock').then(r => r.data.data || []),
  })

  const statCards = [
    { label: 'Doanh thu tháng',  value: formatPrice(stats?.monthRevenue || 0),  icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Đơn hàng mới',     value: stats?.pendingOrders || 0,               icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Tổng sản phẩm',    value: stats?.totalProducts || 0,              icon: Package,     color: 'bg-purple-500' },
    { label: 'Khách hàng',       value: stats?.totalCustomers || 0,             icon: Users,       color: 'bg-orange-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">Đơn hàng gần đây</h2>
          <p className="text-sm text-gray-400">Kết nối API để xem dữ liệu thực tế</p>
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
                    {p.stockQty} còn
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
