import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Warranty } from '@/types'
import Pagination from '@/components/common/Pagination'
import { Search, X, Shield, CheckCircle, AlertTriangle, Clock, Edit2, Check, History } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import AuditTimeline from '@/components/admin/AuditTimeline'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:     { label: 'Còn hiệu lực', color: 'bg-green-100 text-green-700 border-green-200' },
  expired:    { label: 'Hết hạn',      color: 'bg-gray-100 text-gray-600 border-gray-200' },
  voided:     { label: 'Đã vô hiệu',   color: 'bg-red-100 text-red-600 border-red-200' },
  in_service: { label: 'Đang sửa',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
}

export default function AdminWarrantiesPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNotes, setEditNotes]   = useState('')
  const [historyId, setHistoryId]   = useState<number | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-warranties', page],
    queryFn: () =>
      api.get<{ data: Warranty[]; pagination: any }>(`/warranties/admin?page=${page}&size=20`)
        .then(r => r.data),
  })

  const updateNotes = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      api.patch(`/warranties/admin/${id}?notes=${encodeURIComponent(notes)}`),
    onSuccess: () => {
      toast.success('Cập nhật thành công')
      setEditingId(null)
      qc.invalidateQueries({ queryKey: ['admin-warranties'] })
    },
    onError: () => toast.error('Cập nhật thất bại'),
  })

  const warranties: Warranty[] = data?.data || []
  const pagination = data?.pagination

  const filtered = search.trim()
    ? warranties.filter(w =>
        w.product.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.userName?.toLowerCase().includes(search.toLowerCase())) ||
        (w.userPhone?.includes(search))
      )
    : warranties

  const startEdit = (w: Warranty) => {
    setEditingId(w.id)
    setEditNotes(w.notes || '')
  }

  const stats = {
    active:     warranties.filter(w => w.status === 'active').length,
    in_service: warranties.filter(w => w.status === 'in_service').length,
    expired:    warranties.filter(w => w.status === 'expired').length,
    voided:     warranties.filter(w => w.status === 'voided').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý bảo hành</h1>
        <p className="text-sm text-gray-500">{pagination?.total != null ? `${pagination.total} phiếu bảo hành` : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { key: 'active',     icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
          { key: 'in_service', icon: Clock,        color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { key: 'expired',    icon: AlertTriangle,color: 'text-gray-500',  bg: 'bg-gray-50' },
          { key: 'voided',     icon: X,            color: 'text-red-500',   bg: 'bg-red-50' },
        ].map(({ key, icon: Icon, color, bg }) => (
          <div key={key} className={`card p-4 flex items-center gap-3 ${bg}`}>
            <Icon size={20} className={color} />
            <div>
              <p className="text-lg font-bold">{stats[key as keyof typeof stats]}</p>
              <p className="text-xs text-gray-500">{STATUS_LABEL[key].label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên sản phẩm, serial, khách hàng, SĐT..."
          className="w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Sản phẩm', 'Khách hàng', 'Ngày mua', 'Hết hạn', 'Trạng thái', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(w => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {w.product.thumbnail
                      ? <img src={w.product.thumbnail} alt="" className="w-10 h-10 object-contain bg-gray-50 rounded-lg border flex-shrink-0" />
                      : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><Shield size={16} className="text-gray-300" /></div>
                    }
                    <span className="font-medium line-clamp-2 max-w-[200px]">{w.product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{w.userName || '—'}</p>
                  <p className="text-xs text-gray-400">{w.userPhone || ''}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(w.purchaseDate, 'DD/MM/YYYY')}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs ${
                    w.status === 'active' ? 'text-green-600 font-medium' :
                    w.status === 'expired' ? 'text-gray-500' : 'text-red-500'
                  }`}>
                    {formatDate(w.warrantyExpiresAt, 'DD/MM/YYYY')}
                  </span>
                  <p className="text-xs text-gray-400">{w.warrantyMonths} tháng</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_LABEL[w.status]?.color}`}>
                    {STATUS_LABEL[w.status]?.label}
                  </span>
                  {w.notes && <p className="text-xs text-gray-400 mt-0.5 max-w-[120px] truncate" title={w.notes}>{w.notes}</p>}
                </td>
                <td className="px-4 py-3">
                  {editingId === w.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Ghi chú..."
                        className="border rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-primary-500"
                      />
                      <button
                        onClick={() => updateNotes.mutate({ id: w.id, notes: editNotes })}
                        disabled={updateNotes.isPending}
                        className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        title="Lưu"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 border hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                        title="Hủy"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(w)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-primary-500"
                        title="Ghi chú"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setHistoryId(w.id)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-indigo-500"
                        title="Lịch sử thay đổi"
                      >
                        <History size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && <div className="text-center py-12 text-gray-400">Đang tải...</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có phiếu bảo hành nào'}
          </div>
        )}
      </div>

      {pagination && !search && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
      )}

      {historyId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg flex items-center gap-2"><History size={18} /> Lịch sử bảo hành</h3>
              <button onClick={() => setHistoryId(null)}><X size={18} /></button>
            </div>
            <div className="p-6">
              <AuditTimeline entityType="WARRANTY" entityId={historyId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
