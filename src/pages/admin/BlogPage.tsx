import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Plus, Edit, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/types'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminBlogPage() {
  const [page, setPage] = useState(0)
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['admin-blog', page],
    queryFn: () => api.get<{ data: BlogPost[]; pagination: any }>(`/blog?page=${page}&size=15`).then(r => r.data),
  })

  const toggle = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      api.put(`/blog/${id}`, { isPublished: published }),
    onSuccess: () => { toast.success('Đã cập nhật'); qc.invalidateQueries({ queryKey: ['admin-blog'] }) },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý Blog</h1>
        <button className="btn-primary flex items-center gap-2"><Plus size={16} /> Viết bài mới</button>
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
                    <button className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-primary-500"><Edit size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.data?.length && <div className="text-center py-12 text-gray-400">Chưa có bài viết</div>}
      </div>
    </div>
  )
}
