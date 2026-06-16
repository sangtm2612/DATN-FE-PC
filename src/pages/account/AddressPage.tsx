import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Edit, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'

interface Address {
  id: number; fullName: string; phone: string
  province: string; district: string; ward: string
  addressDetail: string; isDefault: boolean
}

export default function AddressPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const qc = useQueryClient()

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get<{ data: Address[] }>('/users/addresses').then(r => r.data.data || []),
  })

  const [form, setForm] = useState({ fullName:'', phone:'', province:'', district:'', ward:'', addressDetail:'', isDefault: false })

  const save = useMutation({
    mutationFn: () => editing
      ? api.put(`/users/addresses/${editing.id}`, form)
      : api.post('/users/addresses', form),
    onSuccess: () => {
      toast.success(editing ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ mới')
      qc.invalidateQueries({ queryKey: ['addresses'] })
      setShowForm(false); setEditing(null)
      setForm({ fullName:'', phone:'', province:'', district:'', ward:'', addressDetail:'', isDefault: false })
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/users/addresses/${id}`),
    onSuccess: () => { toast.success('Đã xóa địa chỉ'); qc.invalidateQueries({ queryKey: ['addresses'] }) },
  })

  const setDefault = useMutation({
    mutationFn: (id: number) => api.patch(`/users/addresses/${id}/default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Địa chỉ giao hàng</h2>
        {(addresses?.length || 0) < 5 && (
          <button onClick={() => { setShowForm(true); setEditing(null) }}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus size={15} /> Thêm địa chỉ mới
          </button>
        )}
      </div>

      {/* Address list */}
      {!addresses?.length ? (
        <div className="text-center py-12 text-gray-400">
          <p>Chưa có địa chỉ nào. Thêm địa chỉ để mua hàng nhanh hơn.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr.id} className={`card p-5 ${addr.isDefault ? 'border-primary-300 bg-primary-50/30' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{addr.fullName}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{addr.addressDetail}, {addr.ward}, {addr.district}, {addr.province}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-3">
                  {!addr.isDefault && (
                    <button onClick={() => setDefault.mutate(addr.id)}
                      className="text-xs text-primary-500 px-2 py-1.5 hover:bg-primary-50 rounded-lg">
                      Đặt mặc định
                    </button>
                  )}
                  <button onClick={() => { setEditing(addr); setForm({ ...addr }); setShowForm(true) }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-500 transition-colors">
                    <Edit size={15} />
                  </button>
                  {!addr.isDefault && (
                    <button onClick={() => remove.mutate(addr.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { key: 'fullName', label: 'Họ và tên', span: 2 },
                { key: 'phone', label: 'Số điện thoại' },
                { key: 'province', label: 'Tỉnh/Thành phố' },
                { key: 'district', label: 'Quận/Huyện' },
                { key: 'ward', label: 'Phường/Xã' },
                { key: 'addressDetail', label: 'Địa chỉ chi tiết', span: 2 },
              ].map(({ key, label, span }) => (
                <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isDefault}
                    onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                    className="rounded accent-primary-500" />
                  <span className="text-sm">Đặt làm địa chỉ mặc định</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1 py-2.5">Hủy</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary flex-1 py-2.5">
                {save.isPending ? 'Đang lưu...' : 'Lưu địa chỉ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
