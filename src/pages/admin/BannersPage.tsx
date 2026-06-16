import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Edit, Trash2, Image } from 'lucide-react'
import toast from 'react-hot-toast'

const POSITIONS = ['home_slider', 'sidebar', 'popup']

export default function AdminBannersPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title:'', imageUrl:'', linkUrl:'', position:'home_slider', sortOrder:0, isActive:true })
  const qc = useQueryClient()

  const { data: banners } = useQuery({
    queryKey: ['all-banners'],
    queryFn: () => api.get<{ data: any[] }>('/banners?position=home_slider').then(r => r.data.data || []),
  })

  const save = useMutation({
    mutationFn: () => editing ? api.put(`/banners/${editing.id}`, form) : api.post('/banners', form),
    onSuccess: () => { toast.success('Đã lưu'); qc.invalidateQueries({ queryKey: ['all-banners'] }); setShowForm(false) },
  })
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/banners/${id}`),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['all-banners'] }) },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý Banner</h1>
        <button onClick={() => { setEditing(null); setForm({ title:'',imageUrl:'',linkUrl:'',position:'home_slider',sortOrder:0,isActive:true }); setShowForm(true) }}
          className="btn-primary flex items-center gap-2"><Plus size={16} /> Thêm Banner</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners?.map(banner => (
          <div key={banner.id} className="card overflow-hidden group">
            <div className="relative aspect-video bg-gray-100">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><Image size={32} /></div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => { setEditing(banner); setForm({ title:banner.title,imageUrl:banner.imageUrl,linkUrl:banner.linkUrl||'',position:banner.position,sortOrder:banner.sortOrder,isActive:banner.isActive }); setShowForm(true) }}
                  className="p-2 bg-white rounded-lg text-gray-700 hover:text-primary-500"><Edit size={16} /></button>
                <button onClick={() => remove.mutate(banner.id)} className="p-2 bg-white rounded-lg text-gray-700 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="p-3">
              <p className="font-medium text-sm truncate">{banner.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{banner.position}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {banner.isActive ? 'Đang hiển thị' : 'Ẩn'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold">{editing ? 'Sửa Banner' : 'Thêm Banner'}</h3>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-6 space-y-3">
              {[{k:'title',l:'Tiêu đề'},{k:'imageUrl',l:'URL Ảnh *'},{k:'linkUrl',l:'Link đích'}].map(({k,l}) => (
                <div key={k}>
                  <label className="block text-sm font-medium mb-1">{l}</label>
                  <input value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="input" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">Vị trí</label>
                <select value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))} className="input">
                  {POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} className="accent-primary-500" />
                <span className="text-sm">Hiển thị banner</span>
              </label>
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
