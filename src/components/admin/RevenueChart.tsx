import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatPrice } from '@/lib/utils'

interface RevenuePoint {
  label: string
  revenue: number
}

interface RevenueChartProps {
  data: RevenuePoint[]
  loading: boolean
}

export default function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return <div className="h-72 flex items-center justify-center text-sm text-gray-400">Đang tải biểu đồ...</div>
  }

  if (!data.length || data.every(p => p.revenue === 0)) {
    return <div className="h-72 flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu doanh thu</div>
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e53935" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#e53935" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatPrice(v)}
            width={90}
          />
          <Tooltip
            formatter={(value) => [formatPrice(Number(value)), 'Doanh thu']}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#e53935"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ r: 3, fill: '#e53935', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
