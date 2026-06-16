import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminBrandsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', logoUrl: '', website: '', description: '' })
  const qc = useQueryClient()

  const { data: brands } = useQuery({
    queryKey: ['all-brands'],
    queryFn: () => api.get<{ data: any[] }>('/brands').then(r => r.data.data || []),
  })

  const save = useMutation({
    mutationFn: () => editing
      ? api.put(`/brands/${editing.id}`, form)
      : api.post('/brands', form),
    onSuccess: () => {
      toast.success(editing ? 'Cập nhật thành công' : 'Tạo thương hiệu thành công')
      qc.invalidateQueries({ queryKey: ['all-brands'] })
      setShowForm(false)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/brands/${id}`),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['all-brands'] }) },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý thương hiệu</h1>
        <button onClick={() => { setEditing(null); setForm({ name:'',slug:'',logoUrl:'',website:'',description:'' }); setShowForm(true) }}
          className="btn-primary flex items-center gap-2"><Plus size={16} /> Thêm thương hiệu</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands?.map(brand => (
          <div key={brand.id} className="card p-4 flex flex-col items-center gap-3 group">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold">
                {brand.name[0]}
              </div>
            )}
            <p className="font-semibold text-sm text-center">{brand.name}</p>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditing(brand); setForm({ name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl||'', website: brand.website||'', description: brand.description||'' }); setShowForm(true) }}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-primary-500"><Edit size={14} /></button>
              <button onClick={() => remove.mutate(brand.id)}
                className="p-1.5 hover:bg-red-100 rounded text-gray-500 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold">{editing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</h3>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-6 space-y-3">
              {[{k:'name',l:'Tên'},{k:'slug',l:'Slug'},{k:'logoUrl',l:'URL Logo'},{k:'website',l:'Website'},{k:'description',l:'Mô tả'}].map(({k,l}) => (
                <div key={k}>
                  <label className="block text-sm font-medium mb-1">{l}</label>
                  <input value={(form as any)[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className="input" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Hủy</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary flex-1">
                {save.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
