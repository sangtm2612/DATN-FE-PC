import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Shield, Trash2, Edit2, Gift, ShoppingCart, Cake, TrendingUp, Hash, Star } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface VoucherPolicy {
  id: number
  name: string
  description: string
  triggerType: string
  voucherId: number
  voucherCode: string
  voucherName: string
  discountType: string
  discountValue: number
  minTotalSpent: number | null
  minCompletedOrders: number | null
  minAccountAgeDays: number | null
  spendingMilestone: number | null
  orderCountMilestone: number | null
  maxDistributions: number | null
  distributedCount: number
  onePerUser: boolean
  customExpiresDays: number | null
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

const TRIGGER_TYPES = [
  { value: 'WELCOME', label: 'Đăng ký mới', icon: Gift, color: 'text-blue-600 bg-blue-50' },
  { value: 'FIRST_ORDER', label: 'Đơn đầu tiên', icon: ShoppingCart, color: 'text-green-600 bg-green-50' },
  { value: 'BIRTHDAY', label: 'Sinh nhật', icon: Cake, color: 'text-pink-600 bg-pink-50' },
  { value: 'SPENDING_MILESTONE', label: 'Mốc chi tiêu', icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
  { value: 'ORDER_COUNT', label: 'Mốc đơn hàng', icon: Hash, color: 'text-purple-600 bg-purple-50' },
  { value: 'REVIEW_REWARD', label: 'Viết đánh giá', icon: Star, color: 'text-yellow-600 bg-yellow-50' },
]

const emptyForm = {
  name: '', description: '', triggerType: 'WELCOME', voucherId: '',
  minTotalSpent: '', minCompletedOrders: '', minAccountAgeDays: '',
  spendingMilestone: '', orderCountMilestone: '',
  maxDistributions: '', onePerUser: true, customExpiresDays: '',
  startDate: '', endDate: '', isActive: true,
}

export default function VoucherPoliciesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const qc = useQueryClient()

  const { data: policies } = useQuery({
    queryKey: ['admin-voucher-policies'],
    queryFn: () => api.get<{ data: VoucherPolicy[] }>('/voucher-policies').then(r => r.data.data || []),
  })

  const { data: vouchers } = useQuery({
    queryKey: ['admin-vouchers-for-policy'],
    queryFn: () => api.get<{ data: any[] }>('/vouchers').then(r => r.data.data || []),
    enabled: showForm,
  })

  const personalVouchers = vouchers?.filter((v: any) => v.voucherType === 'PERSONAL') || []

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        voucherId: Number(form.voucherId) || null,
        minTotalSpent: form.minTotalSpent ? Number(form.minTotalSpent) : null,
        minCompletedOrders: form.minCompletedOrders ? Number(form.minCompletedOrders) : null,
        minAccountAgeDays: form.minAccountAgeDays ? Number(form.minAccountAgeDays) : null,
        spendingMilestone: form.spendingMilestone ? Number(form.spendingMilestone) : null,
        orderCountMilestone: form.orderCountMilestone ? Number(form.orderCountMilestone) : null,
        maxDistributions: form.maxDistributions ? Number(form.maxDistributions) : null,
        customExpiresDays: form.customExpiresDays ? Number(form.customExpiresDays) : null,
      }
      return editId
        ? api.put(`/voucher-policies/${editId}`, payload)
        : api.post('/voucher-policies', payload)
    },
    onSuccess: () => {
      toast.success(editId ? 'Cập nhật thành công' : 'Tạo chính sách thành công')
      qc.invalidateQueries({ queryKey: ['admin-voucher-policies'] })
      closeForm()
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/voucher-policies/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa chính sách')
      qc.invalidateQueries({ queryKey: ['admin-voucher-policies'] })
    },
  })

  const closeForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
  }

  const openEdit = (p: VoucherPolicy) => {
    setEditId(p.id)
    setForm({
      name: p.name, description: p.description || '',
      triggerType: p.triggerType, voucherId: String(p.voucherId),
      minTotalSpent: p.minTotalSpent != null ? String(p.minTotalSpent) : '',
      minCompletedOrders: p.minCompletedOrders != null ? String(p.minCompletedOrders) : '',
      minAccountAgeDays: p.minAccountAgeDays != null ? String(p.minAccountAgeDays) : '',
      spendingMilestone: p.spendingMilestone != null ? String(p.spendingMilestone) : '',
      orderCountMilestone: p.orderCountMilestone != null ? String(p.orderCountMilestone) : '',
      maxDistributions: p.maxDistributions != null ? String(p.maxDistributions) : '',
      onePerUser: p.onePerUser, customExpiresDays: p.customExpiresDays != null ? String(p.customExpiresDays) : '',
      startDate: p.startDate?.slice(0, 16) || '', endDate: p.endDate?.slice(0, 16) || '',
      isActive: p.isActive,
    })
    setShowForm(true)
  }

  const getTrigger = (type: string) => TRIGGER_TYPES.find(t => t.value === type)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chính sách Voucher</h1>
          <p className="text-gray-500 text-sm mt-1">Thiết lập quy tắc phân phối voucher tự động</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo chính sách
        </button>
      </div>

      {/* Policy Cards */}
      <div className="space-y-4">
        {policies?.map((p) => {
          const trigger = getTrigger(p.triggerType)
          const TriggerIcon = trigger?.icon || Shield
          return (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${trigger?.color || 'bg-gray-50 text-gray-600'}`}>
                    <TriggerIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    {p.description && <p className="text-gray-500 text-sm mt-0.5">{p.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${trigger?.color}`}>
                        {trigger?.label}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        Voucher: <strong>{p.voucherCode}</strong>
                        {' — '}
                        {p.discountType === 'percent' ? `${p.discountValue}%` : formatPrice(p.discountValue)}
                      </span>
                      {p.customExpiresDays && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          HSD: {p.customExpiresDays} ngày
                        </span>
                      )}
                    </div>
                    {/* Điều kiện */}
                    <div className="mt-3 text-sm text-gray-500 space-y-0.5">
                      {p.minTotalSpent != null && <p>Chi tiêu tối thiểu: {formatPrice(p.minTotalSpent)}</p>}
                      {p.minCompletedOrders != null && <p>Đơn hoàn thành tối thiểu: {p.minCompletedOrders}</p>}
                      {p.minAccountAgeDays != null && <p>Tuổi tài khoản tối thiểu: {p.minAccountAgeDays} ngày</p>}
                      {p.spendingMilestone != null && <p>Mốc chi tiêu: {formatPrice(p.spendingMilestone)}</p>}
                      {p.orderCountMilestone != null && <p>Mốc số đơn: {p.orderCountMilestone}</p>}
                      <p>Đã phát: <strong>{p.distributedCount}</strong>{p.maxDistributions ? ` / ${p.maxDistributions}` : ' (không giới hạn)'}</p>
                      <p>Hiệu lực: {formatDate(p.startDate, 'DD/MM/YYYY')} → {formatDate(p.endDate, 'DD/MM/YYYY')}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Hoạt động' : 'Tắt'}
                  </span>
                  <button onClick={() => openEdit(p)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if (confirm('Xóa chính sách này?')) deleteMut.mutate(p.id) }}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {!policies?.length && (
          <div className="text-center py-16 text-gray-400">
            <Shield size={48} className="mx-auto mb-3 opacity-50" />
            <p>Chưa có chính sách voucher nào</p>
            <p className="text-sm">Tạo chính sách để tự động phát voucher cho khách hàng</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg">{editId ? 'Sửa chính sách' : 'Tạo chính sách mới'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Thông tin cơ bản */}
              <div>
                <label className="block text-sm font-medium mb-1">Tên chính sách *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="VD: Voucher chào mừng thành viên mới" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" rows={2} placeholder="Mô tả chi tiết chính sách..." />
              </div>

              {/* Sự kiện kích hoạt */}
              <div>
                <label className="block text-sm font-medium mb-2">Sự kiện kích hoạt *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TRIGGER_TYPES.map(t => {
                    const Icon = t.icon
                    return (
                      <button key={t.value} type="button"
                        onClick={() => setForm(f => ({ ...f, triggerType: t.value }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left text-sm transition-all
                          ${form.triggerType === t.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <Icon size={18} />
                        <span className="font-medium">{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Voucher */}
              <div>
                <label className="block text-sm font-medium mb-1">Voucher phát cho user *</label>
                <select value={form.voucherId} onChange={e => setForm(f => ({ ...f, voucherId: e.target.value }))} className="input">
                  <option value="">-- Chọn voucher (loại PERSONAL) --</option>
                  {personalVouchers.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.code} — {v.name || (v.discountType === 'percent' ? `Giảm ${v.discountValue}%` : `Giảm ${formatPrice(v.discountValue)}`)}
                    </option>
                  ))}
                </select>
                {vouchers && personalVouchers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Chưa có voucher PERSONAL nào. Hãy tạo voucher loại PERSONAL trước.</p>
                )}
              </div>

              {/* Điều kiện */}
              <div>
                <label className="block text-sm font-semibold mb-2">Điều kiện nhận voucher</label>
                <div className="grid grid-cols-2 gap-3">
                  {(form.triggerType === 'SPENDING_MILESTONE') && (
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Mốc chi tiêu</label>
                      <input type="number" value={form.spendingMilestone} onChange={e => setForm(f => ({ ...f, spendingMilestone: e.target.value }))} className="input" placeholder="VD: 10000000" />
                    </div>
                  )}
                  {(form.triggerType === 'ORDER_COUNT') && (
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Mốc số đơn hoàn thành</label>
                      <input type="number" value={form.orderCountMilestone} onChange={e => setForm(f => ({ ...f, orderCountMilestone: e.target.value }))} className="input" placeholder="VD: 5" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Chi tiêu tối thiểu</label>
                    <input type="number" value={form.minTotalSpent} onChange={e => setForm(f => ({ ...f, minTotalSpent: e.target.value }))} className="input" placeholder="Không yêu cầu" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Đơn hoàn thành tối thiểu</label>
                    <input type="number" value={form.minCompletedOrders} onChange={e => setForm(f => ({ ...f, minCompletedOrders: e.target.value }))} className="input" placeholder="Không yêu cầu" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tuổi tài khoản (ngày)</label>
                    <input type="number" value={form.minAccountAgeDays} onChange={e => setForm(f => ({ ...f, minAccountAgeDays: e.target.value }))} className="input" placeholder="Không yêu cầu" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">HSD voucher (ngày)</label>
                    <input type="number" value={form.customExpiresDays} onChange={e => setForm(f => ({ ...f, customExpiresDays: e.target.value }))} className="input" placeholder="Theo voucher gốc" />
                  </div>
                </div>
              </div>

              {/* Giới hạn & thời gian */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tổng lượt phát tối đa</label>
                  <input type="number" value={form.maxDistributions} onChange={e => setForm(f => ({ ...f, maxDistributions: e.target.value }))} className="input" placeholder="Không giới hạn" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.onePerUser} onChange={e => setForm(f => ({ ...f, onePerUser: e.target.checked }))} className="rounded" />
                    <span className="text-sm">Mỗi user chỉ nhận 1 lần</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ngày bắt đầu *</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ngày kết thúc *</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="input" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Kích hoạt chính sách</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={closeForm} className="btn-outline flex-1">Hủy</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary flex-1">
                {save.isPending ? 'Đang lưu...' : (editId ? 'Cập nhật' : 'Tạo chính sách')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
