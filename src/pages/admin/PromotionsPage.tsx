import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Percent } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Category, Brand } from '@/types'
import toast from 'react-hot-toast'

interface Promotion {
  id: number
  promotionType: string
  name: string
  discountType: string
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
  startDate: string
  endDate: string
  isActive: boolean
  buildpcMinCpuDiscountPct?: number
  buildpcMaxCpuDiscountPct?: number
  buildpcCashBonus?: number
  buildpcMaxCashBonus?: number
  productIds: number[]
  categoryIds: number[]
  brandIds: number[]
}

const PROMOTION_TYPE_LABEL: Record<string, string> = {
  general: 'Chung', build_pc: 'Build PC', flash_sale: 'Flash Sale',
  brand_deal: 'Theo thương hiệu', student: 'Sinh viên', give_away: 'Quà tặng',
}

function flattenCategoryTree(
  nodes: Category[],
  depth = 0,
  out: { id: number; name: string; depth: number }[] = [],
): { id: number; name: string; depth: number }[] {
  for (const n of nodes) {
    out.push({ id: n.id, name: n.name, depth })
    if (n.children?.length) flattenCategoryTree(n.children, depth + 1, out)
  }
  return out
}

const emptyForm = {
  promotionType: 'general', name: '', description: '',
  discountType: 'percent', discountValue: 0, minOrderValue: 0, maxDiscount: '',
  startDate: '', endDate: '', isActive: true,
  buildpcMinCpuDiscountPct: '', buildpcMaxCpuDiscountPct: '',
  buildpcCashBonus: '', buildpcMaxCashBonus: '',
  productIds: '', categoryIds: [] as number[], brandIds: [] as number[],
}

export default function AdminPromotionsPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const qc = useQueryClient()

  const { data: promotions } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: () => api.get<{ data: Promotion[] }>('/promotions').then(r => r.data.data || []),
  })

  const { data: categories } = useQuery({
    queryKey: ['all-categories-tree'],
    queryFn: () => api.get<{ data: Category[] }>('/categories/tree').then(r => r.data.data || []),
  })

  const { data: brands } = useQuery({
    queryKey: ['all-brands'],
    queryFn: () => api.get<{ data: Brand[] }>('/brands').then(r => r.data.data || []),
  })

  const save = useMutation({
    mutationFn: () => api.post('/promotions', {
      ...form,
      maxDiscount: form.maxDiscount || null,
      buildpcMinCpuDiscountPct: form.buildpcMinCpuDiscountPct || null,
      buildpcMaxCpuDiscountPct: form.buildpcMaxCpuDiscountPct || null,
      buildpcCashBonus: form.buildpcCashBonus || null,
      buildpcMaxCashBonus: form.buildpcMaxCashBonus || null,
      productIds: form.productIds ? form.productIds.split(',').map(s => +s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      toast.success('Tạo khuyến mãi thành công')
      qc.invalidateQueries({ queryKey: ['admin-promotions'] })
      setShowForm(false); setForm(emptyForm)
    },
  })

  const toggleActive = useMutation({
    mutationFn: (p: Promotion) => api.put(`/promotions/${p.id}`, { ...p, isActive: !p.isActive }),
    onSuccess: () => { toast.success('Đã cập nhật'); qc.invalidateQueries({ queryKey: ['admin-promotions'] }) },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/promotions/${id}`),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['admin-promotions'] }) },
  })

  const toggleScope = (key: 'categoryIds' | 'brandIds', id: number) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter(x => x !== id) : [...f[key], id],
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý khuyến mãi</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo khuyến mãi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions?.map(p => (
          <div key={p.id} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Percent size={16} className="text-primary-500" />
                <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                  {PROMOTION_TYPE_LABEL[p.promotionType] || p.promotionType}
                </span>
              </div>
              <button
                onClick={() => toggleActive.mutate(p)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {p.isActive ? 'Đang hoạt động' : 'Vô hiệu'}
              </button>
            </div>
            <p className="font-semibold text-gray-800 mb-2">{p.name}</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Giảm: <strong className="text-primary-500">
                {p.discountType === 'percent' ? `${p.discountValue}%` : formatPrice(p.discountValue)}
              </strong></p>
              <p>Đơn tối thiểu: {formatPrice(p.minOrderValue)}</p>
              {p.promotionType === 'build_pc' && (
                <p className="text-xs text-amber-600">
                  CPU: {p.buildpcMinCpuDiscountPct ?? 0}%–{p.buildpcMaxCpuDiscountPct ?? 0}%
                  {p.buildpcCashBonus ? ` · Thưởng ${formatPrice(p.buildpcCashBonus)}` : ''}
                </p>
              )}
              <p>Phạm vi: {!p.productIds.length && !p.categoryIds.length && !p.brandIds.length
                ? 'Toàn bộ sản phẩm'
                : `${p.productIds.length} SP, ${p.categoryIds.length} danh mục, ${p.brandIds.length} thương hiệu`}</p>
              <p>{formatDate(p.startDate, 'DD/MM/YYYY')} – {formatDate(p.endDate, 'DD/MM/YYYY')}</p>
            </div>
            <button onClick={() => remove.mutate(p.id)}
              className="mt-3 text-xs text-red-500 hover:underline">Xóa</button>
          </div>
        ))}
        {!promotions?.length && (
          <div className="col-span-3 text-center py-12 text-gray-400">Chưa có khuyến mãi nào</div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg">Tạo khuyến mãi mới</h3>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên khuyến mãi *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại khuyến mãi</label>
                  <select value={form.promotionType} onChange={e => setForm(f => ({ ...f, promotionType: e.target.value }))} className="input">
                    {Object.entries(PROMOTION_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
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
                  <label className="block text-sm font-medium mb-1">Giảm tối đa</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} className="input" placeholder="Không giới hạn" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn tối thiểu</label>
                  <input type="number" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: +e.target.value }))} className="input" />
                </div>
                <div />
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày hết hạn</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="input" />
                </div>
              </div>

              {form.promotionType === 'build_pc' && (
                <div className="grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">% giảm CPU (combo cơ bản)</label>
                    <input type="number" value={form.buildpcMinCpuDiscountPct} onChange={e => setForm(f => ({ ...f, buildpcMinCpuDiscountPct: e.target.value }))} className="input" placeholder="VD: 30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">% giảm CPU (kèm VGA)</label>
                    <input type="number" value={form.buildpcMaxCpuDiscountPct} onChange={e => setForm(f => ({ ...f, buildpcMaxCpuDiscountPct: e.target.value }))} className="input" placeholder="VD: 50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Thưởng tiền mặt</label>
                    <input type="number" value={form.buildpcCashBonus} onChange={e => setForm(f => ({ ...f, buildpcCashBonus: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Thưởng tối đa</label>
                    <input type="number" value={form.buildpcMaxCashBonus} onChange={e => setForm(f => ({ ...f, buildpcMaxCashBonus: e.target.value }))} className="input" />
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-1">Phạm vi áp dụng (để trống = toàn bộ sản phẩm)</label>
                <input value={form.productIds} onChange={e => setForm(f => ({ ...f, productIds: e.target.value }))}
                  className="input mb-3" placeholder="ID sản phẩm, cách nhau bởi dấu phẩy (VD: 12,15,20)" />

                {!!categories?.length && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Danh mục</p>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {flattenCategoryTree(categories).map(c => (
                        <button type="button" key={c.id} onClick={() => toggleScope('categoryIds', c.id)}
                          className={`text-xs px-2.5 py-1 rounded-full border ${form.categoryIds.includes(c.id) ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600'}`}>
                          {'\u00A0\u00A0'.repeat(c.depth) + (c.depth > 0 ? '└─ ' : '') + c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!!brands?.length && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Thương hiệu</p>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {brands.map(b => (
                        <button type="button" key={b.id} onClick={() => toggleScope('brandIds', b.id)}
                          className={`text-xs px-2.5 py-1 rounded-full border ${form.brandIds.includes(b.id) ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600'}`}>
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Hủy</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary flex-1">
                {save.isPending ? 'Đang tạo...' : 'Tạo khuyến mãi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
