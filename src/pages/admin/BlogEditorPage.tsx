import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Eye, Upload, X } from 'lucide-react'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import type { BlogPost } from '@/types'

interface BlogCategory {
  id: number
  name: string
  slug: string
}

interface BlogFormData {
  title: string
  excerpt: string
  content: string
  thumbnailUrl: string
  blogCategoryId: number
  isPublished: boolean
  metaTitle: string
  metaDesc: string
  mentionedProductIds: number[]
}

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    thumbnailUrl: '',
    blogCategoryId: 0,
    isPublished: false,
    metaTitle: '',
    metaDesc: '',
    mentionedProductIds: [],
  })

  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(false)

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => api.get<{ data: BlogCategory[] }>('/blog/categories').then(r => r.data.data || []),
  })

  // Fetch existing post if editing
  const { data: existingPost, isLoading } = useQuery({
    queryKey: ['blog-post-edit', id],
    queryFn: () => api.get<{ data: BlogPost }>(`/blog/id/${id}`).then(r => r.data.data),
    enabled: isEdit,
  })

  // Fetch mentioned products if editing
  const { data: mentionedProducts } = useQuery({
    queryKey: ['blog-products', id],
    queryFn: () => api.get<{ data: number[] }>(`/blog/${id}/products`).then(r => r.data.data || []),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existingPost) {
      setFormData({
        title: existingPost.title || '',
        excerpt: existingPost.excerpt || '',
        content: existingPost.content || '',
        thumbnailUrl: existingPost.thumbnailUrl || '',
        blogCategoryId: existingPost.blogCategory?.id || 0,
        isPublished: existingPost.isPublished || false,
        metaTitle: existingPost.metaTitle || '',
        metaDesc: existingPost.metaDesc || '',
        mentionedProductIds: mentionedProducts || [],
      })
    }
  }, [existingPost, mentionedProducts])

  const handleChange = (field: keyof BlogFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File tối đa 10MB')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post<{ data: { url: string } }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      handleChange('thumbnailUrl', res.data.data.url)
      toast.success('Đã tải ảnh lên')
    } catch (error) {
      toast.error('Không thể tải ảnh lên')
    } finally {
      setUploading(false)
    }
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!formData.title.trim()) {
        throw new Error('Vui lòng nhập tiêu đề')
      }
      if (!formData.content.trim()) {
        throw new Error('Vui lòng nhập nội dung')
      }
      if (!formData.blogCategoryId) {
        throw new Error('Vui lòng chọn danh mục')
      }

      const payload = {
        ...formData,
        mentionedProductIds: undefined, // Remove from main payload
      }

      return isEdit
        ? api.put<{ data: BlogPost }>(`/blog/${id}`, payload)
        : api.post<{ data: BlogPost }>('/blog', payload)
    },
    onSuccess: async (response) => {
      const postId = response.data.data.id

      // Update mentioned products
      if (formData.mentionedProductIds.length > 0) {
        await api.put(`/blog/${postId}/products`, formData.mentionedProductIds)
      }

      toast.success(isEdit ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết mới')
      qc.invalidateQueries({ queryKey: ['admin-blog'] })
      navigate('/admin/blog')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra')
    },
  })

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/blog')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">{isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreview(!preview)}
            className="btn-outline flex items-center gap-2"
          >
            <Eye size={16} />
            {preview ? 'Chế độ soạn' : 'Xem trước'}
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu bài viết'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-4">
          {!preview ? (
            <>
              <div className="card p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tiêu đề *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="input text-lg font-semibold"
                    placeholder="Nhập tiêu đề bài viết..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mô tả ngắn</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => handleChange('excerpt', e.target.value)}
                    className="input min-h-20"
                    rows={3}
                    placeholder="Mô tả ngắn gọn về bài viết..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nội dung *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    className="input font-mono text-sm"
                    rows={20}
                    placeholder="Nhập nội dung bài viết... (Hỗ trợ HTML)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Hỗ trợ HTML. Sử dụng &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;img&gt;, v.v.
                  </p>
                </div>
              </div>

              {/* SEO Section */}
              <div className="card p-6 space-y-4">
                <h3 className="font-semibold text-lg">SEO & Meta tags</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Meta Title</label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => handleChange('metaTitle', e.target.value)}
                    className="input"
                    placeholder="Tiêu đề hiển thị trên Google..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Meta Description</label>
                  <textarea
                    value={formData.metaDesc}
                    onChange={(e) => handleChange('metaDesc', e.target.value)}
                    className="input"
                    rows={2}
                    placeholder="Mô tả hiển thị trên Google..."
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="card p-6">
              <h2 className="text-3xl font-bold mb-4">{formData.title || 'Chưa có tiêu đề'}</h2>
              {formData.excerpt && (
                <p className="text-gray-600 mb-6 text-lg">{formData.excerpt}</p>
              )}
              {formData.thumbnailUrl && (
                <img
                  src={formData.thumbnailUrl}
                  alt=""
                  className="w-full rounded-lg mb-6"
                />
              )}
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-gray-400">Chưa có nội dung</p>' }}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish settings */}
          <div className="card p-4 space-y-4">
            <h3 className="font-semibold">Xuất bản</h3>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="publish"
                checked={formData.isPublished}
                onChange={(e) => handleChange('isPublished', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="publish" className="text-sm cursor-pointer">
                Công khai bài viết
              </label>
            </div>
          </div>

          {/* Category */}
          <div className="card p-4 space-y-3">
            <label className="block text-sm font-semibold">Danh mục *</label>
            <select
              value={formData.blogCategoryId}
              onChange={(e) => handleChange('blogCategoryId', Number(e.target.value))}
              className="input"
            >
              <option value={0}>-- Chọn danh mục --</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Thumbnail */}
          <div className="card p-4 space-y-3">
            <label className="block text-sm font-semibold">Ảnh đại diện</label>
            {formData.thumbnailUrl ? (
              <div className="relative">
                <img src={formData.thumbnailUrl} alt="" className="w-full rounded-lg" />
                <button
                  onClick={() => handleChange('thumbnailUrl', '')}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary-500">
                <Upload size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Tải ảnh lên</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
            {uploading && (
              <div className="text-sm text-center text-gray-500">Đang tải...</div>
            )}
          </div>

          {/* Mentioned Products */}
          <div className="card p-4 space-y-3">
            <label className="block text-sm font-semibold">Sản phẩm liên quan</label>
            <input
              type="text"
              value={formData.mentionedProductIds.join(', ')}
              onChange={(e) => {
                const ids = e.target.value
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean)
                  .map(Number)
                  .filter(n => !isNaN(n))
                handleChange('mentionedProductIds', ids)
              }}
              className="input"
              placeholder="VD: 12, 45, 78"
            />
            <p className="text-xs text-gray-500">Nhập ID sản phẩm, phân cách bởi dấu phẩy</p>
          </div>
        </div>
      </div>
    </div>
  )
}
