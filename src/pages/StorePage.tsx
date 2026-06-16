import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Store } from '@/types'
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react'

export default function StorePage() {
  const { data: stores, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.get<{ data: Store[] }>('/stores').then(r => r.data.data || []),
  })

  const grouped = stores?.reduce((acc: Record<string, Store[]>, s) => {
    if (!acc[s.province]) acc[s.province] = []
    acc[s.province].push(s)
    return acc
  }, {}) || {}

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2">Hệ thống cửa hàng</h1>
      <p className="text-gray-500 mb-8">KinhDuanPC có mặt tại 21 cửa hàng trên toàn quốc</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      ) : (
        Object.entries(grouped).map(([province, list]) => (
          <div key={province} className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-primary-500" /> {province}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(store => (
                <div key={store.id} className="card p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-gray-800 mb-3">{store.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{store.address}</span>
                    </div>
                    {store.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <a href={`tel:${store.phone}`} className="hover:text-primary-500">{store.phone}</a>
                      </div>
                    )}
                    {store.openHours && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400 flex-shrink-0" />
                        <span>{store.openHours}</span>
                      </div>
                    )}
                  </div>
                  {store.googleMapsUrl && (
                    <a href={store.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary-500 hover:underline">
                      <ExternalLink size={12} /> Xem bản đồ
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
