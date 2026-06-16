import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productService, type ProductFilter } from '@/services/productService'
import api from '@/lib/axios'
import ProductGrid from '@/components/product/ProductGrid'
import Pagination from '@/components/common/Pagination'
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import type { Brand } from '@/types'
import { formatPrice } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'featured',   label: 'Nổi bật' },
  { value: 'price-asc',  label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'best-seller',label: 'Bán chạy nhất' },
  { value: 'rating',     label: 'Đánh giá cao' },
]

const PRICE_RANGES = [
  { label: 'Dưới 5 triệu',     min: 0,         max: 5_000_000 },
  { label: '5 - 10 triệu',     min: 5_000_000, max: 10_000_000 },
  { label: '10 - 20 triệu',    min: 10_000_000,max: 20_000_000 },
  { label: '20 - 30 triệu',    min: 20_000_000,max: 30_000_000 },
  { label: 'Trên 30 triệu',    min: 30_000_000,max: undefined },
]

export default function ProductListPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)

  const categorySlug = slug
  const page = parseInt(searchParams.get('page') || '0')
  const sort = searchParams.get('sort') || 'featured'
  const brandId = searchParams.get('brandId') ? parseInt(searchParams.get('brandId')!) : undefined
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined

  const { data: categoryData } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => api.get<{ data: any }>(`/categories/${categorySlug}`).then(r => r.data.data),
    enabled: !!categorySlug,
  })

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get<{ data: Brand[] }>('/brands').then(r => r.data.data || []),
  })

  const filter: ProductFilter = {
    categoryId: categoryData?.id,
    brandId, minPrice, maxPrice, sort, page, size: 24,
  }

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['products', filter],
    queryFn: () => productService.getList(filter).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  const data = rawData as { data?: any[]; pagination?: any } | undefined
  const products = data?.data || []
  const pagination = data?.pagination

  const updateFilter = (params: Record<string, string | undefined>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === '') next.delete(k)
        else next.set(k, v)
      })
      next.set('page', '0')
      return next
    })
  }

  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <span className="hover:text-primary-500 cursor-pointer">Trang chủ</span>
        {categoryData && (
          <> <span className="mx-1">/</span> <span className="text-gray-800">{categoryData.name}</span> </>
        )}
      </nav>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`${filterOpen ? 'block' : 'hidden'} lg:block w-60 flex-shrink-0`}>
          <div className="card p-4 space-y-6 sticky top-24">
            {/* Brand filter */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Thương hiệu</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {brands?.map(b => (
                  <label key={b.id} className="flex items-center gap-2 cursor-pointer hover:text-primary-500">
                    <input
                      type="radio"
                      name="brand"
                      checked={brandId === b.id}
                      onChange={() => updateFilter({ brandId: String(b.id) })}
                      className="accent-primary-500"
                    />
                    <span className="text-sm">{b.name}</span>
                  </label>
                ))}
                {brandId && (
                  <button onClick={() => updateFilter({ brandId: undefined })}
                    className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                    <X size={12} /> Bỏ lọc thương hiệu
                  </button>
                )}
              </div>
            </div>

            {/* Price filter */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Khoảng giá</h3>
              <div className="space-y-2">
                {PRICE_RANGES.map(range => (
                  <label key={range.label} className="flex items-center gap-2 cursor-pointer hover:text-primary-500">
                    <input
                      type="radio"
                      name="price"
                      checked={minPrice === range.min && maxPrice === range.max}
                      onChange={() => updateFilter({
                        minPrice: String(range.min),
                        maxPrice: range.max !== undefined ? String(range.max) : undefined,
                      })}
                      className="accent-primary-500"
                    />
                    <span className="text-sm">{range.label}</span>
                  </label>
                ))}
                {(minPrice || maxPrice) && (
                  <button onClick={() => updateFilter({ minPrice: undefined, maxPrice: undefined })}
                    className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                    <X size={12} /> Bỏ lọc giá
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setFilterOpen(!filterOpen)}
                className="lg:hidden flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:border-primary-500">
                <SlidersHorizontal size={16} /> Bộ lọc
              </button>
              <h1 className="text-lg font-bold text-gray-800">
                {categoryData?.name || 'Tất cả sản phẩm'}
              </h1>
              {pagination && (
                <span className="text-sm text-gray-500">({pagination.total} sản phẩm)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sắp xếp:</span>
              <select
                value={sort}
                onChange={e => updateFilter({ sort: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <ProductGrid products={products} loading={isLoading} />

          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={p => updateFilter({ page: String(p) })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
