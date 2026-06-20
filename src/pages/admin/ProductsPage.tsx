import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/services/productService'
import { formatPrice } from '@/lib/utils'
import Pagination from '@/components/common/Pagination'
import { Plus, Edit, Eye, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import type { Product, Category, Brand } from '@/types'

interface ProductForm {
  name: string
  sku: string
  shortDesc: string
  description: string
  thumbnail: string
  price: string
  originalPrice: string
  stockQty: string
  warrantyMonths: string
  warrantyText: string
  categoryId: string
  brandId: string
  isActive: boolean
  isFeatured: boolean
}

const emptyForm: ProductForm = {
  name: '', sku: '', shortDesc: '', description: '',
  thumbnail: '', price: '', originalPrice: '',
  stockQty: '', warrantyMonths: '12', warrantyText: '',
  categoryId: '', brandId: '',
  isActive: true, isFeatured: false,
}

function toForm(p: Product): ProductForm {
  return {
    name: p.name,
    sku: p.sku || '',
    shortDesc: p.shortDesc || '',
    description: p.description || '',
    thumbnail: p.thumbnail || '',
    price: String(p.price),
    originalPrice: String(p.originalPrice || ''),
    stockQty: String(p.stockQty),
    warrantyMonths: String(p.warrantyMonths),
    warrantyText: p.warrantyText || '',
    categoryId: String(p.category?.id || ''),
    brandId: String(p.brand?.id || ''),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
  }
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', keyword, page],
    queryFn: () => keyword
      ? productService.search(keyword, page, 20).then(r => r.data)
      : productService.getList({ page, size: 20 }).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['admin-categories-select'],
    queryFn: () => api.get<{ data: Category[] }>('/categories').then(r => r.data.data || []),
  })

  const { data: brands } = useQuery({
    queryKey: ['admin-brands-select'],
    queryFn: () => api.get<{ data: Brand[] }>('/brands').then(r => r.data.data || []),
  })

  const saveProduct = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        sku: form.sku || undefined,
        shortDesc: form.shortDesc || undefined,
        description: form.description || undefined,
        thumbnail: form.thumbnail || undefined,
        price: form.price ? Number(form.price) : undefined,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stockQty: form.stockQty ? Number(form.stockQty) : undefined,
        warrantyMonths: form.warrantyMonths ? Number(form.warrantyMonths) : undefined,
        warrantyText: form.warrantyText || undefined,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        brandId: form.brandId ? Number(form.brandId) : undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      }
      return editingProduct
        ? api.put(`/products/${editingProduct.id}`, payload)
        : api.post('/products', payload)
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công')
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      closeModal()
    },
  })

  const openCreate = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setForm(toForm(p))
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setForm(emptyForm)
  }

  const set = (key: keyof ProductForm, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  const products = data?.data || []
  const pagination = data?.pagination

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setKeyword(searchInput); setPage(0) } }}
            placeholder="Tìm theo tên, SKU..."
            className="input pl-9"
          />
        </div>
        <button onClick={() => { setKeyword(searchInput); setPage(0) }} className="btn-primary px-4">Tìm</button>
        {keyword && <button onClick={() => { setKeyword(''); setSearchInput('') }} className="btn-outline px-4">Xóa</button>}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Sản phẩm', 'SKU', 'Danh mục', 'Giá', 'Tồn kho', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td></tr>
                ))
              : products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.thumbnail || '/placeholder.png'} alt={p.name}
                          className="w-10 h-10 object-contain bg-gray-50 rounded-lg border" />
                        <span className="font-medium line-clamp-2 max-w-48">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-primary-600">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.stockQty <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                        {p.stockQty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link to={`/san-pham/${p.slug}`} target="_blank"
                          className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-blue-500 transition-colors"
                          title="Xem trang sản phẩm">
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-primary-500 transition-colors"
                          title="Chỉnh sửa sản phẩm">
                          <Edit size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
        {!isLoading && products.length === 0 && (
          <div className="text-center py-12 text-gray-400">Không có sản phẩm</div>
        )}
      </div>

      {pagination && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
      )}

      {/* Modal Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold">
                {editingProduct ? `Chỉnh sửa: ${editingProduct.name}` : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Tên sản phẩm */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    className="input" placeholder="VD: Laptop Dell XPS 15 9530" />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input value={form.sku} onChange={e => set('sku', e.target.value)}
                    className="input" placeholder="VD: DELL-XPS-9530" />
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Ảnh đại diện</label>
                  <input value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)}
                    className="input" placeholder="https://..." />
                </div>

                {/* Giá bán */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                    className="input" placeholder="VD: 35000000" min={0} />
                </div>

                {/* Giá gốc */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc (VNĐ)</label>
                  <input type="number" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)}
                    className="input" placeholder="Để trống nếu không giảm giá" min={0} />
                </div>

                {/* Tồn kho */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tồn kho *</label>
                  <input type="number" value={form.stockQty} onChange={e => set('stockQty', e.target.value)}
                    className="input" placeholder="VD: 50" min={0} />
                </div>

                {/* Bảo hành */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bảo hành (tháng)</label>
                  <input type="number" value={form.warrantyMonths} onChange={e => set('warrantyMonths', e.target.value)}
                    className="input" placeholder="VD: 12" min={0} />
                </div>

                {/* Danh mục */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className="input">
                    <option value="">-- Chọn danh mục --</option>
                    {categories?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Thương hiệu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                  <select value={form.brandId} onChange={e => set('brandId', e.target.value)} className="input">
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands?.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Mô tả ngắn */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                  <textarea value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)}
                    className="input h-20 resize-none" placeholder="Mô tả ngắn gọn về sản phẩm..." />
                </div>

                {/* Mô tả chi tiết */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết (HTML)</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)}
                    className="input h-32 resize-none font-mono text-xs" placeholder="<p>Nội dung mô tả...</p>" />
                </div>

                {/* Checkbox options */}
                <div className="sm:col-span-2 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive}
                      onChange={e => set('isActive', e.target.checked)}
                      className="w-4 h-4 accent-primary-500" />
                    <span className="text-sm font-medium text-gray-700">Hiển thị sản phẩm</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured}
                      onChange={e => set('isFeatured', e.target.checked)}
                      className="w-4 h-4 accent-primary-500" />
                    <span className="text-sm font-medium text-gray-700">Sản phẩm nổi bật</span>
                  </label>
                </div>

                {/* Preview thumbnail */}
                {form.thumbnail && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-2">Xem trước ảnh:</p>
                    <img src={form.thumbnail} alt="preview"
                      className="h-24 w-24 object-contain border rounded-xl bg-gray-50"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={closeModal} className="btn-outline flex-1 py-2.5">Hủy</button>
              <button
                onClick={() => saveProduct.mutate()}
                disabled={saveProduct.isPending || !form.name || !form.price}
                className="btn-primary flex-1 py-2.5 disabled:opacity-50"
              >
                {saveProduct.isPending
                  ? (editingProduct ? 'Đang lưu...' : 'Đang thêm...')
                  : (editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
