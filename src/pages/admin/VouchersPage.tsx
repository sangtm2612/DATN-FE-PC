import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Ticket, Copy, Search, X, Edit2, Trash2 } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const emptyForm = {
  code: '', name: '', voucherType: 'PUBLIC', discountType: 'percent', discountValue: 0,
  minOrderValue: 0, maxDiscount: '', usageLimit: '', usagePerUser: 1,
  startDate: '', endDate: '', isActive: true,
}

export default function AdminVouchersPage() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [form, setForm] = useState(emptyForm)
  const qc = useQueryClient()

  const { data: vouchers } = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: () => api.get<{ data: any[] }>('/vouchers').then(r => r.data.data || []),
  })

  const save = useMutation({
    mutationFn: () => {
      const { usageLimit, ...rest } = form
      const payload = {
        ...rest,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        maxUsageCount: usageLimit ? Number(usageLimit) : null,
      }
      return editId
        ? api.put(`/vouchers/${editId}`, payload)
        : api.post('/vouchers', payload)
    },
    onSuccess: () => {
      toast.success(editId ? 'Cập nhật voucher thành công' : 'Tạo voucher thành công')
      qc.invalidateQueries({ queryKey: ['admin-vouchers'] })
      closeForm()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại')
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/vouchers/${id}`),
    onSuccess: () => { toast.success('Đã xóa voucher'); qc.invalidateQueries({ queryKey: ['admin-vouchers'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Xóa thất bại'),
  })

  const generateCode = () => {
    const code = 'KDP' + Math.random().toString(36).substring(2, 7).toUpperCase()
    setForm(f => ({ ...f, code }))
  }

  const openEdit = (v: any) => {
    setEditId(v.id)
    setForm({
      code: v.code,
      name: v.name || '',
      voucherType: v.voucherType,
      discountType: v.discountType,
      discountValue: v.discountValue,
      minOrderValue: v.minOrderValue ?? 0,
      maxDiscount: v.maxDiscount != null ? String(v.maxDiscount) : '',
      usageLimit: v.maxUsageCount != null ? String(v.maxUsageCount) : '',
      usagePerUser: v.usagePerUser ?? 1,
      startDate: v.startDate?.slice(0, 16) || '',
      endDate: v.endDate?.slice(0, 16) || '',
      isActive: v.isActive,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
  }

  const allVouchers: any[] = vouchers || []
  const filtered = allVouchers.filter(v => {
    const matchSearch = !search.trim() ||
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      (v.name?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = !statusFilter ||
      (statusFilter === 'active' ? v.isActive : !v.isActive)
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý Voucher</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo Voucher
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo mã hoặc tên voucher..."
            className="w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 min-w-[160px]">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Vô hiệu</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v: any) => (
          <div key={v.id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-primary-500" />
                <span className="font-bold font-mono text-lg text-primary-600">{v.code}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { navigator.clipboard.writeText(v.code); toast.success('Đã copy!') }}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Copy mã">
                  <Copy size={14} />
                </button>
                <button onClick={() => openEdit(v)}
                  className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-500" title="Chỉnh sửa">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => { if (confirm(`Xóa voucher ${v.code}?`)) remove.mutate(v.id) }}
                  className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Xóa">
                  <Trash2 size={14} />
                </button>
              </div>
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
            <div className="mt-3 flex gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full inline-block font-medium
                ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {v.isActive ? 'Đang hoạt động' : 'Vô hiệu'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full inline-block font-medium
                ${v.voucherType === 'PERSONAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {v.voucherType}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            {search || statusFilter ? 'Không tìm thấy voucher phù hợp' : 'Chưa có voucher nào'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg">{editId ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}</h3>
              <button onClick={closeForm}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mã Voucher *</label>
                <div className="flex gap-2">
                  <input
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="input flex-1"
                    placeholder="VD: SUMMER20"
                    disabled={!!editId}
                  />
                  {!editId && (
                    <button type="button" onClick={generateCode} className="btn-outline px-3 py-2 text-sm">Tự động</button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tên mô tả</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Loại voucher</label>
                <select value={form.voucherType} onChange={e => setForm(f => ({ ...f, voucherType: e.target.value }))} className="input">
                  <option value="PUBLIC">PUBLIC — Ai biết mã đều dùng được</option>
                  <option value="PERSONAL">PERSONAL — Chỉ user được phân phối</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại giảm giá</label>
                  <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="input">
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed_amount">Số tiền cố định</option>
                    <option value="free_shipping">Miễn phí ship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá trị giảm *</label>
                  <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: +e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn tối thiểu</label>
                  <input type="number" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: +e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giảm tối đa</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} className="input" placeholder="Không giới hạn" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giới hạn dùng (tổng)</label>
                  <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} className="input" placeholder="Không giới hạn" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giới hạn / người</label>
                  <input type="number" value={form.usagePerUser} onChange={e => setForm(f => ({ ...f, usagePerUser: +e.target.value }))} className="input" min={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày hết hạn</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="input" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Kích hoạt voucher</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={closeForm} className="btn-outline flex-1">Hủy</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary flex-1">
                {save.isPending ? 'Đang lưu...' : (editId ? 'Cập nhật' : 'Tạo Voucher')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
