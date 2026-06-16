import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Store } from '@/types'
import { MapPin, Phone, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminStoresPage() {
  const qc = useQueryClient()
  const { data: stores } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: () => api.get<{ data: Store[] }>('/stores').then(r => r.data.data || []),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý cửa hàng</h1>
        <button className="btn-primary flex items-center gap-2">+ Thêm cửa hàng</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores?.map(store => (
          <div key={store.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-gray-800">{store.name}</h3>
              <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-500">
                <Edit size={15} />
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{store.address}, {store.province}</span>
              </div>
              {store.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400 flex-shrink-0" />
                  <span>{store.phone}</span>
                </div>
              )}
              {store.openHours && (
                <p className="text-xs text-gray-400">🕐 {store.openHours}</p>
              )}
            </div>
            <div className={`mt-3 text-xs px-2 py-0.5 rounded-full inline-block font-medium
              ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {store.isActive ? 'Đang hoạt động' : 'Tạm đóng'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
