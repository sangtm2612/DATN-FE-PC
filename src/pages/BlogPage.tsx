import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/axios'
import type { BlogPost } from '@/types'
import { formatDate } from '@/lib/utils'
import Pagination from '@/components/common/Pagination'
import { Eye, Calendar } from 'lucide-react'

export default function BlogPage() {
  const [page, setPage] = useState(0)
  const [categoryId, setCategoryId] = useState<number | undefined>()

  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => api.get<{ data: any[] }>('/blog/categories').then(r => r.data.data || []),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['blog', page, categoryId],
    queryFn: () => api.get<{ data: BlogPost[]; pagination: any }>(
      `/blog?page=${page}&size=12${categoryId ? `&categoryId=${categoryId}` : ''}`
    ).then(r => r.data),
  })

  const posts: BlogPost[] = data?.data || []

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Tin tức & Blog công nghệ</h1>

      {/* Category filter */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => { setCategoryId(undefined); setPage(0) }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
              ${!categoryId ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 text-gray-600 hover:border-primary-500'}`}
          >
            Tất cả
          </button>
          {categories.map((cat: any) => (
            <button key={cat.id}
              onClick={() => { setCategoryId(cat.id); setPage(0) }}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
                ${categoryId === cat.id ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 text-gray-600 hover:border-primary-500'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton aspect-video" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 rounded w-3/4" />
                <div className="skeleton h-3 rounded" />
                <div className="skeleton h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Chưa có bài viết nào</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Link key={post.id} to={`/tin-tuc/${post.slug}`} className="card group hover:shadow-md transition-shadow">
              <div className="aspect-video overflow-hidden bg-gray-100">
                <img
                  src={post.thumbnailUrl || '/placeholder-blog.png'}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                {post.blogCategory && (
                  <span className="text-xs font-semibold text-primary-500 uppercase tracking-wide">
                    {post.blogCategory.name}
                  </span>
                )}
                <h3 className="font-bold text-gray-800 mt-1 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDate(post.publishedAt, 'DD/MM/YYYY')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {post.viewCount} lượt xem
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data?.pagination && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
