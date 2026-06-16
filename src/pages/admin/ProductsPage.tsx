import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/services/productService'
import { formatPrice } from '@/lib/utils'
import Pagination from '@/components/common/Pagination'
import { Plus, Edit, Eye, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', keyword, page],
    queryFn: () => keyword
      ? productService.search(keyword, page, 20).then(r => r.data)
      : productService.getList({ page, size: 20 }).then(r => r.data),
  })

  const products = data?.data || []
  const pagination = data?.pagination

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <button className="btn-primary flex items-center gap-2">
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
              ? [...Array(5)].map((_,i) => (
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
                    <td className="px-4 py-3 text-gray-500">{p.category?.name}</td>
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
                          className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-blue-500 transition-colors">
                          <Eye size={15} />
                        </Link>
                        <button className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-primary-500 transition-colors">
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
    </div>
  )
}
