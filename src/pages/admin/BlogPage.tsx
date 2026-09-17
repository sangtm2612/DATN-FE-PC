import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Edit, Eye, Link2, X, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/types'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Pagination from '@/components/common/Pagination'

export default function AdminBlogPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [publishedFilter, setPublishedFilter] = useState<'' | 'published' | 'draft'>('')
  const [productsModalPost, setProductsModalPost] = useState<BlogPost | null>(null)
  const [productIdsInput, setProductIdsInput] = useState('')
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['admin-blog', page, search, publishedFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), size: '15' })
      if (search) params.set('keyword', search)
      if (publishedFilter === 'published') params.set('isPublished', 'true')
      if (publishedFilter === 'draft') params.set('isPublished', 'false')
      return api.get<{ data: BlogPost[]; pagination: any }>(`/blog?${params}`).then(r => r.data)
    },
  })

  const toggle = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      api.put(`/blog/${id}`, { isPublished: published }),
    onSuccess: () => { toast.success('Đã cập nhật'); qc.invalidateQueries({ queryKey: ['admin-blog'] }) },
  })

  const openProductsModal = async (post: BlogPost) => {
    setProductsModalPost(post)
    const res = await api.get<{ data: number[] }>(`/blog/${post.id}/products`)
    setProductIdsInput((res.data.data || []).join(', '))
  }

  const saveProducts = useMutation({
    mutationFn: () => {
      const ids = productIdsInput.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n))
      return api.put(`/blog/${productsModalPost!.id}/products`, ids)
    },
    onSuccess: () => {
      toast.success('Đã cập nhật sản phẩm liên quan')
      setProductsModalPost(null)
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý Blog</h1>
        <Link to="/admin/blog/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Viết bài mới
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput.trim()); setPage(0) } }}
            placeholder="Tìm tiêu đề bài viết..."
            className="w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary-500"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearch(''); setPage(0) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={publishedFilter} onChange={e => { setPublishedFilter(e.target.value as any); setPage(0) }}
          className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 min-w-[150px]">
          <option value="">Tất cả</option>
          <option value="published">Đã đăng</option>
          <option value="draft">Nháp</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Tiêu đề', 'Danh mục', 'Lượt xem', 'Ngày đăng', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map(post => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {post.thumbnailUrl && (
                      <img src={post.thumbnailUrl} alt="" className="w-10 h-10 object-cover rounded" />
                    )}
                    <span className="font-medium line-clamp-2 max-w-64">{post.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{post.blogCategory?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{post.viewCount}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(post.publishedAt, 'DD/MM/YYYY')}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggle.mutate({ id: post.id, published: !post.isPublished })}
                    className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {post.isPublished ? 'Đã đăng' : 'Nháp'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Link to={`/tin-tuc/${post.slug}`} target="_blank"
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-blue-500"><Eye size={15} /></Link>
                    <Link to={`/admin/blog/edit/${post.id}`}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-primary-500"><Edit size={15} /></Link>
                    <button onClick={() => openProductsModal(post)}
                      title="Sản phẩm liên quan"
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-primary-500"><Link2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.data?.length && <div className="text-center py-12 text-gray-400">Chưa có bài viết</div>}
      </div>

      {data?.pagination && (
        <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
      )}

      {productsModalPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">Sản phẩm liên quan</h3>
              <button onClick={() => setProductsModalPost(null)}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-500 line-clamp-2">{productsModalPost.title}</p>
              <div>
                <label className="block text-sm font-medium mb-1">ID sản phẩm (phân cách bởi dấu phẩy)</label>
                <input value={productIdsInput} onChange={e => setProductIdsInput(e.target.value)}
                  className="input" placeholder="VD: 12, 45, 78" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setProductsModalPost(null)} className="btn-outline flex-1">Hủy</button>
              <button onClick={() => saveProducts.mutate()} disabled={saveProducts.isPending} className="btn-primary flex-1">
                {saveProducts.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
