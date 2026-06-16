import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { BlogPost } from '@/types'
import { formatDate } from '@/lib/utils'
import { Calendar, Eye, User, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => api.get<{ data: BlogPost }>(`/blog/${slug}`).then(r => r.data.data),
  })

  if (isLoading) return (
    <div className="container py-8 max-w-4xl">
      <div className="skeleton h-8 rounded w-3/4 mb-4" />
      <div className="skeleton h-4 rounded w-1/2 mb-8" />
      <div className="skeleton aspect-video rounded-xl mb-8" />
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-4 rounded mb-2" />)}
    </div>
  )

  if (!post) return (
    <div className="container py-16 text-center text-gray-500">Bài viết không tồn tại</div>
  )

  return (
    <div className="container py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-500">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to="/tin-tuc" className="hover:text-primary-500">Tin tức</Link>
        {post.blogCategory && (
          <>
            <ChevronRight size={14} />
            <span className="text-primary-500">{post.blogCategory.name}</span>
          </>
        )}
      </nav>

      {/* Category tag */}
      {post.blogCategory && (
        <span className="inline-block bg-primary-100 text-primary-600 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
          {post.blogCategory.name}
        </span>
      )}

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
        {post.author && (
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {post.author.fullName}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar size={14} />
          {formatDate(post.publishedAt, 'DD/MM/YYYY HH:mm')}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye size={14} />
          {post.viewCount} lượt xem
        </span>
      </div>

      {post.thumbnailUrl && (
        <img
          src={post.thumbnailUrl}
          alt={post.title}
          className="w-full aspect-video object-cover rounded-xl mb-8"
        />
      )}

      {post.excerpt && (
        <p className="text-lg text-gray-600 font-medium leading-relaxed mb-6 p-4 bg-gray-50 rounded-xl border-l-4 border-primary-500">
          {post.excerpt}
        </p>
      )}

      <div
        className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-a:text-primary-500 prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: post.content || '' }}
      />
    </div>
  )
}
