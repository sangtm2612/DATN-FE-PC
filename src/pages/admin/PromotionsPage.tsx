import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Percent, Edit2, Trash2, X, Search, Package } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Category, Brand, Product, ApiResponse } from '@/types'
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

type SelectedProduct = { id: number; name: string }

const emptyForm = {
  promotionType: 'general', name: '', description: '',
  discountType: 'percent', discountValue: 0, minOrderValue: 0, maxDiscount: '',
  startDate: '', endDate: '', isActive: true,
  buildpcMinCpuDiscountPct: '', buildpcMaxCpuDiscountPct: '',
  buildpcCashBonus: '', buildpcMaxCashBonus: '',
  productIds: [] as SelectedProduct[], categoryIds: [] as number[], brandIds: [] as number[],
}

export default function AdminPromotionsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const productInputRef = useRef<HTMLInputElement>(null)
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

  const { data: productSearchResults } = useQuery({
    queryKey: ['product-picker-search', productSearch],
    queryFn: () => api.get<ApiResponse<Product[]>>(`/products/search?keyword=${encodeURIComponent(productSearch)}&size=10&page=0`).then(r => r.data.data || []),
    enabled: productSearch.trim().length >= 2,
  })

  const addProduct = (p: Product) => {
    if (form.productIds.some(x => x.id === p.id)) return
    setForm(f => ({ ...f, productIds: [...f.productIds, { id: p.id, name: p.name }] }))
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const removeProduct = (id: number) => {
    setForm(f => ({ ...f, productIds: f.productIds.filter(x => x.id !== id) }))
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        maxDiscount: form.maxDiscount || null,
        buildpcMinCpuDiscountPct: form.buildpcMinCpuDiscountPct || null,
        buildpcMaxCpuDiscountPct: form.buildpcMaxCpuDiscountPct || null,
        buildpcCashBonus: form.buildpcCashBonus || null,
        buildpcMaxCashBonus: form.buildpcMaxCashBonus || null,
        productIds: form.productIds.map(p => p.id),
      }
      return editId
        ? api.put(`/promotions/${editId}`, payload)
        : api.post('/promotions', payload)
    },
    onSuccess: () => {
      toast.success(editId ? 'Cập nhật khuyến mãi thành công' : 'Tạo khuyến mãi thành công')
      qc.invalidateQueries({ queryKey: ['admin-promotions'] })
      closeForm()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại')
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/promotions/${id}`),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['admin-promotions'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Xóa thất bại'),
  })

  const toggleScope = (key: 'categoryIds' | 'brandIds', id: number) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter(x => x !== id) : [...f[key], id],
    }))
  }

  const openEdit = (p: Promotion) => {
    setEditId(p.id)
    setForm({
      promotionType: p.promotionType,
      name: p.name,
      description: '',
      discountType: p.discountType,
      discountValue: p.discountValue,
      minOrderValue: p.minOrderValue ?? 0,
      maxDiscount: p.maxDiscount != null ? String(p.maxDiscount) : '',
      startDate: p.startDate?.slice(0, 16) || '',
      endDate: p.endDate?.slice(0, 16) || '',
      isActive: p.isActive,
      buildpcMinCpuDiscountPct: p.buildpcMinCpuDiscountPct != null ? String(p.buildpcMinCpuDiscountPct) : '',
      buildpcMaxCpuDiscountPct: p.buildpcMaxCpuDiscountPct != null ? String(p.buildpcMaxCpuDiscountPct) : '',
      buildpcCashBonus: p.buildpcCashBonus != null ? String(p.buildpcCashBonus) : '',
      buildpcMaxCashBonus: p.buildpcMaxCashBonus != null ? String(p.buildpcMaxCashBonus) : '',
      productIds: p.productIds?.map(id => ({ id, name: `SP #${id}` })) || [],
      categoryIds: p.categoryIds || [],
      brandIds: p.brandIds || [],
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setProductSearch('')
    setShowProductDropdown(false)
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
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.isActive ? 'Đang hoạt động' : 'Vô hiệu'}
              </span>
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
            <div className="mt-3 flex gap-2">
              <button onClick={() => openEdit(p)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                <Edit2 size={12} /> Chỉnh sửa
              </button>
              <button onClick={() => { if (confirm('Xóa khuyến mãi này?')) remove.mutate(p.id) }}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:underline">
                <Trash2 size={12} /> Xóa
              </button>
            </div>
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
              <h3 className="font-bold text-lg">{editId ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}</h3>
              <button onClick={closeForm}><X size={18} /></button>
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
                <label className="block text-sm font-medium mb-2">Phạm vi áp dụng (để trống = toàn bộ sản phẩm)</label>

                {/* Selected product chips */}
                {form.productIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.productIds.map(p => (
                      <span key={p.id} className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-1 rounded-full">
                        <Package size={10} className="flex-shrink-0" />
                        <span className="max-w-[160px] truncate">{p.name}</span>
                        <button type="button" onClick={() => removeProduct(p.id)} className="hover:text-red-500 flex-shrink-0">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Product search input */}
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    ref={productInputRef}
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true) }}
                    onFocus={() => productSearch.trim().length >= 2 && setShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
                    placeholder="Tìm sản phẩm theo tên..."
                    className="input pl-8 pr-8"
                  />
                  {productSearch && (
                    <button type="button" onMouseDown={e => { e.preventDefault(); setProductSearch(''); setShowProductDropdown(false) }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  )}
                  {showProductDropdown && productSearch.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {(productSearchResults?.length ?? 0) > 0 ? productSearchResults!.map(p => {
                        const already = form.productIds.some(x => x.id === p.id)
                        return (
                          <button key={p.id} type="button"
                            onMouseDown={e => { e.preventDefault(); if (!already) addProduct(p) }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${already ? 'opacity-40 cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
                          >
                            <Package size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="flex-1 truncate">{p.name}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{formatPrice(p.price)}</span>
                            {already && <span className="text-xs text-primary-500 flex-shrink-0">Đã chọn</span>}
                          </button>
                        )
                      }) : (
                        <p className="px-3 py-3 text-sm text-gray-400 text-center">Không tìm thấy sản phẩm</p>
                      )}
                    </div>
                  )}
                </div>

                {!!categories?.length && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Danh mục</p>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {flattenCategoryTree(categories).map(c => (
                        <button type="button" key={c.id} onClick={() => toggleScope('categoryIds', c.id)}
                          className={`text-xs px-2.5 py-1 rounded-full border ${form.categoryIds.includes(c.id) ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600'}`}>
                          {'  '.repeat(c.depth) + (c.depth > 0 ? '- ' : '') + c.name}
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

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Kích hoạt khuyến mãi</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={closeForm} className="btn-outline flex-1">Hủy</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary flex-1">
                {save.isPending ? 'Đang lưu...' : (editId ? 'Cập nhật' : 'Tạo khuyến mãi')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
