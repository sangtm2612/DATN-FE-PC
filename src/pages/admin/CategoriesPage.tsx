import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Category } from '@/types'

export default function AdminCategoriesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', iconUrl: '', imageUrl: '', description: '', sortOrder: 0, parentId: '' })
  const qc = useQueryClient()

  const { data: categories } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => api.get<{ data: Category[] }>('/categories').then(r => r.data.data || []),
  })

  const save = useMutation({
    mutationFn: () => editing
      ? api.put(`/categories/${editing.id}`, form)
      : api.post('/categories', form),
    onSuccess: () => {
      toast.success(editing ? 'Cập nhật thành công' : 'Tạo danh mục thành công')
      qc.invalidateQueries({ queryKey: ['all-categories'] })
      setShowForm(false); setEditing(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['all-categories'] }) },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', slug: '', iconUrl: '', imageUrl: '', description: '', sortOrder: 0, parentId: '' })
    setShowForm(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug, iconUrl: cat.iconUrl || '', imageUrl: cat.imageUrl || '', description: cat.description || '', sortOrder: cat.sortOrder, parentId: '' })
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Tên danh mục', 'Slug', 'Thứ tự', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories?.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {cat.iconUrl && <img src={cat.iconUrl} alt="" className="w-6 h-6 object-contain" />}
                    <span className="font-medium">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-500">{cat.sortOrder}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.isActive ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-primary-500 transition-colors">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => remove.mutate(cat.id)} className="p-1.5 hover:bg-red-100 rounded text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'name', label: 'Tên danh mục *' },
                { key: 'slug', label: 'Slug URL *' },
                { key: 'iconUrl', label: 'URL Icon' },
                { key: 'imageUrl', label: 'URL Ảnh' },
                { key: 'description', label: 'Mô tả' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))} className="input w-24" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1 py-2.5">Hủy</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary flex-1 py-2.5">
                {save.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
