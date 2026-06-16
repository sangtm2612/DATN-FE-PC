import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Ticket, Copy } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminVouchersPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '', name: '', discountType: 'percent', discountValue: 0,
    minOrderValue: 0, maxDiscount: '', usageLimit: '', usagePerUser: 1,
    startDate: '', endDate: '', isActive: true
  })
  const qc = useQueryClient()

  const { data: vouchers } = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: () => api.get<{ data: any[] }>('/vouchers').then(r => r.data.data || []),
  })

  const save = useMutation({
    mutationFn: () => api.post('/vouchers', form),
    onSuccess: () => { toast.success('Tạo voucher thành công'); qc.invalidateQueries({ queryKey: ['admin-vouchers'] }); setShowForm(false) },
  })

  const generateCode = () => {
    const code = 'KDP' + Math.random().toString(36).substring(2, 7).toUpperCase()
    setForm(f => ({ ...f, code }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý Voucher</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo Voucher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers?.map((v: any) => (
          <div key={v.id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-primary-500" />
                <span className="font-bold font-mono text-lg text-primary-600">{v.code}</span>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(v.code); toast.success('Đã copy!') }}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                <Copy size={14} />
              </button>
            </div>
            {v.name && <p className="text-sm text-gray-600 mb-2">{v.name}</p>}
            <div className="space-y-1 text-sm text-gray-600">
              <p>Giảm: <strong className="text-primary-500">
                {v.discountType === 'percent' ? `${v.discountValue}%` : formatPrice(v.discountValue)}
              </strong></p>
              <p>Đơn tối thiểu: {formatPrice(v.minOrderValue)}</p>
              <p>Đã dùng: {v.usedCount}{v.usageLimit ? `/${v.usageLimit}` : ''}</p>
              <p>Hết hạn: {formatDate(v.endDate, 'DD/MM/YYYY')}</p>
            </div>
            <div className={`mt-3 text-xs px-2 py-0.5 rounded-full inline-block font-medium
              ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {v.isActive ? 'Đang hoạt động' : 'Vô hiệu'}
            </div>
          </div>
        ))}
        {!vouchers?.length && (
          <div className="col-span-3 text-center py-12 text-gray-400">Chưa có voucher nào</div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg">Tạo Voucher mới</h3>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mã Voucher *</label>
                <div className="flex gap-2">
                  <input value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value.toUpperCase()}))} className="input flex-1" placeholder="VD: SUMMER20" />
                  <button type="button" onClick={generateCode} className="btn-outline px-3 py-2 text-sm">Tự động</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tên mô tả</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại giảm giá</label>
                  <select value={form.discountType} onChange={e=>setForm(f=>({...f,discountType:e.target.value}))} className="input">
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed_amount">Số tiền cố định</option>
                    <option value="free_shipping">Miễn phí ship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá trị giảm *</label>
                  <input type="number" value={form.discountValue} onChange={e=>setForm(f=>({...f,discountValue:+e.target.value}))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn tối thiểu</label>
                  <input type="number" value={form.minOrderValue} onChange={e=>setForm(f=>({...f,minOrderValue:+e.target.value}))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giảm tối đa</label>
                  <input type="number" value={form.maxDiscount} onChange={e=>setForm(f=>({...f,maxDiscount:e.target.value}))} className="input" placeholder="Không giới hạn" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input type="datetime-local" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày hết hạn</label>
                  <input type="datetime-local" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} className="input" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Hủy</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary flex-1">
                {save.isPending ? 'Đang tạo...' : 'Tạo Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
