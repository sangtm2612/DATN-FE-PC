import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/services/productService'
import { cartService } from '@/services/cartService'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import api from '@/lib/axios'
import ProductGrid from '@/components/product/ProductGrid'
import { ShoppingCart, Zap, Heart, Star, Shield, Truck, RotateCcw, ChevronRight, Minus, Plus, User, ThumbsUp } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Review } from '@/types'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc')
  const [reviewPage, setReviewPage] = useState(0)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showStoreStock, setShowStoreStock] = useState(false)
  const [helpfulState, setHelpfulState] = useState<Record<number, { isHelpful: boolean; count: number }>>({})
  const { setCart, setOpen } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug!).then(r => r.data.data),
  })

  const { data: related } = useQuery({
    queryKey: ['related', product?.id],
    queryFn: () => productService.getRelated(product!.id).then(r => r.data.data || []),
    enabled: !!product?.id,
  })

  const { data: recentlyViewed } = useQuery({
    queryKey: ['recently-viewed'],
    queryFn: () => productService.getRecentlyViewed().then(r => r.data.data || []),
  })

  const { data: storeStock, isLoading: storeStockLoading } = useQuery({
    queryKey: ['product-stock-by-store', product?.id],
    queryFn: () => api.get<{ data: { store: { id: number; name: string; address: string }; stockQty: number }[] }>(
      `/products/${product!.id}/stock-by-store`
    ).then(r => r.data.data || []),
    enabled: !!product?.id && showStoreStock,
  })

  // Fetch reviews khi tab reviews được mở
  const { data: reviewData, isLoading: reviewLoading } = useQuery({
    queryKey: ['reviews', product?.id, reviewPage],
    queryFn: () => api.get<{ data: Review[]; pagination: any }>(
      `/reviews/product/${product!.id}?page=${reviewPage}&size=10`
    ).then(r => r.data),
    enabled: !!product?.id && activeTab === 'reviews',
  })

  const addToCart = useMutation({
    mutationFn: () => cartService.addItem(product!.id, quantity),
    onSuccess: (res) => {
      if (res.data.data) { setCart(res.data.data); setOpen(true) }
      toast.success('Đã thêm vào giỏ hàng')
    },
  })

  const submitReview = useMutation({
    mutationFn: () => api.post(`/reviews/product/${product!.id}`, reviewForm),
    onSuccess: () => {
      toast.success('Cảm ơn bạn đã đánh giá!')
      setShowReviewForm(false)
      setReviewForm({ rating: 5, title: '', content: '' })
      qc.invalidateQueries({ queryKey: ['reviews', product?.id] })
      qc.invalidateQueries({ queryKey: ['product', slug] })
    },
  })

  const toggleHelpful = useMutation({
    mutationFn: (reviewId: number) =>
      api.post<{ data: { helpfulCount: number; isHelpful: boolean } }>(`/reviews/${reviewId}/helpful`),
    onSuccess: (res, reviewId) => {
      setHelpfulState(prev => ({
        ...prev,
        [reviewId]: { isHelpful: res.data.data.isHelpful, count: res.data.data.helpfulCount },
      }))
    },
  })

  if (isLoading) return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="skeleton aspect-square rounded-2xl" />
        <div className="space-y-4">
          {[...Array(5)].map((_,i) => <div key={i} className={`skeleton h-${i===0?8:4} rounded`} />)}
        </div>
      </div>
    </div>
  )

  if (!product) return <div className="container py-16 text-center text-gray-500">Sản phẩm không tồn tại</div>

  const images = product.images?.length ? product.images : [{ imageUrl: product.thumbnail || '/placeholder.png', id: 0, altText: '', isPrimary: true, sortOrder: 0 }]

  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1 flex-wrap">
        <Link to="/" className="hover:text-primary-500">Trang chủ</Link>
        <ChevronRight size={14} />
        {product.category && (
          <><Link to={`/category/${product.category.slug}`} className="hover:text-primary-500">{product.category.name}</Link><ChevronRight size={14} /></>
        )}
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Images */}
        <div>
          <div className="aspect-square bg-white rounded-2xl border overflow-hidden mb-3">
            <img
              src={images[selectedImage]?.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-6"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <button key={img.id}
                onClick={() => setSelectedImage(i)}
                className={`flex-shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden transition-colors ${i === selectedImage ? 'border-primary-500' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <img src={img.imageUrl} alt="" className="w-full h-full object-contain p-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          {/* Brand */}
          {product.brand && (
            <Link to={`/brand/${product.brand.slug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-500">
              {product.brand.logoUrl && <img src={product.brand.logoUrl} alt={product.brand.name} className="h-5 object-contain" />}
              {product.brand.name}
            </Link>
          )}

          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>

          {/* Rating */}
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} className={i <= Math.round(product.ratingAvg) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                ))}
              </div>
              <span className="font-medium">{product.ratingAvg}</span>
              <span className="text-gray-400">({product.ratingCount} đánh giá)</span>
              <span className="text-gray-400">• Đã bán {product.soldQty}</span>
            </div>
          )}

          {/* Price */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-primary-500">{formatPrice(product.price)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
              )}
              {product.discountPercent && (
                <span className="badge-sale text-sm">-{product.discountPercent}%</span>
              )}
            </div>
          </div>

          {/* Short desc */}
          {product.shortDesc && (
            <p className="text-gray-600 leading-relaxed">{product.shortDesc}</p>
          )}

          {/* Warranty & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 rounded-lg p-3">
              <Shield size={16} className="text-green-500" />
              <span>{product.warrantyText || `Bảo hành ${product.warrantyMonths} tháng`}</span>
            </div>
            <div className={`flex items-center gap-2 text-sm rounded-lg p-3 ${product.stockQty > 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full ${product.stockQty > 0 ? 'bg-blue-500' : 'bg-red-500'}`} />
              {product.stockQty > 0 ? `Còn ${product.stockQty} sản phẩm` : 'Hết hàng'}
            </div>
          </div>

          {/* Nhận tại showroom */}
          <div>
            <button
              type="button"
              onClick={() => setShowStoreStock(v => !v)}
              className="text-sm text-primary-500 hover:underline flex items-center gap-1.5"
            >
              <Truck size={14} /> Kiểm tra hàng tại showroom
            </button>
            {showStoreStock && (
              <div className="mt-2 border rounded-lg p-3 text-sm">
                {storeStockLoading ? (
                  <p className="text-gray-400">Đang tải...</p>
                ) : !storeStock?.length ? (
                  <p className="text-gray-400">Hiện chưa có showroom nào còn hàng sản phẩm này</p>
                ) : (
                  <ul className="space-y-1.5">
                    {storeStock.map(s => (
                      <li key={s.store.id} className="flex items-center justify-between gap-2">
                        <span className="text-gray-700">{s.store.name}</span>
                        <span className="text-green-600 font-medium flex-shrink-0">Còn {s.stockQty}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Quantity */}
          {product.stockQty > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Số lượng:</span>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Math.min(product.stockQty, parseInt(e.target.value) || 1)))}
                  className="w-12 text-center text-sm font-medium outline-none"
                />
                <button onClick={() => setQuantity(q => Math.min(product.stockQty, q + 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => addToCart.mutate()}
              disabled={product.stockQty === 0 || addToCart.isPending}
              className="flex-1 btn-outline flex items-center justify-center gap-2 py-3 text-base"
            >
              <ShoppingCart size={18} />
              {addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ'}
            </button>
            <Link
              to="/checkout"
              onClick={() => addToCart.mutate()}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-base"
            >
              <Zap size={18} /> Mua ngay
            </Link>
          </div>

          {/* Policies */}
          <div className="border rounded-xl p-4 space-y-2 text-sm text-gray-600">
            {[
              { icon: Truck,      text: 'Miễn phí giao hàng toàn quốc cho đơn từ 5 triệu' },
              { icon: RotateCcw,  text: 'Đổi trả trong 15 ngày nếu có lỗi từ nhà sản xuất' },
              { icon: Shield,     text: 'Bảo hành chính hãng tại tất cả cửa hàng KinhDuanPC' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={14} className="text-primary-500 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-8">
        <div className="flex border-b overflow-x-auto">
          {(['desc', 'specs', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
            >
              {{ desc: 'Mô tả sản phẩm', specs: 'Thông số kỹ thuật', reviews: `Đánh giá (${product.ratingCount})` }[tab]}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'desc' && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: product.description || '<p>Chưa có mô tả</p>' }} />
          )}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {product.attributeGroups?.map(group => (
                <div key={group.groupName}>
                  <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b">{group.groupName}</h3>
                  <table className="w-full">
                    <tbody>
                      {group.attributes.map(attr => (
                        <tr key={attr.name} className="border-b last:border-0">
                          <td className="py-2.5 pr-4 text-sm text-gray-500 font-medium w-2/5">{attr.name}</td>
                          <td className="py-2.5 text-sm text-gray-800">
                            {attr.value}{attr.unit ? ` ${attr.unit}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )) || <p className="text-gray-500">Chưa có thông số kỹ thuật</p>}
            </div>
          )}
          {activeTab === 'reviews' && (
            <div>
              {/* Tổng quan rating */}
              {product.ratingCount > 0 && (
                <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-gray-800">{product.ratingAvg.toFixed(1)}</p>
                    <div className="flex justify-center mt-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={16} className={i <= Math.round(product.ratingAvg) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{product.ratingCount} đánh giá</p>
                  </div>
                </div>
              )}

              {/* Nút viết đánh giá */}
              {isAuthenticated && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="btn-outline mb-6 flex items-center gap-2"
                >
                  <Star size={16} /> Viết đánh giá của bạn
                </button>
              )}

              {/* Form đánh giá */}
              {showReviewForm && (
                <div className="border rounded-xl p-5 mb-6 bg-gray-50">
                  <h3 className="font-bold text-gray-800 mb-4">Đánh giá sản phẩm</h3>

                  {/* Stars */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số sao *</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: star }))}>
                          <Star size={28}
                            className={star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                    <input
                      value={reviewForm.title}
                      onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                      className="input"
                      placeholder="Tóm tắt đánh giá của bạn..."
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung đánh giá</label>
                    <textarea
                      value={reviewForm.content}
                      onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))}
                      className="input h-24 resize-none"
                      placeholder="Chia sẻ trải nghiệm sử dụng sản phẩm..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="btn-outline px-5 py-2"
                    >Hủy</button>
                    <button
                      onClick={() => submitReview.mutate()}
                      disabled={submitReview.isPending}
                      className="btn-primary px-5 py-2"
                    >
                      {submitReview.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách reviews */}
              {reviewLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="border rounded-xl p-4 space-y-2">
                      <div className="skeleton h-4 rounded w-1/3" />
                      <div className="skeleton h-3 rounded w-full" />
                      <div className="skeleton h-3 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : reviewData?.data && reviewData.data.length > 0 ? (
                <div className="space-y-4">
                  {reviewData.data.map((review: Review) => (
                    <div key={review.id} className="border rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {review.user?.fullName?.[0] ?? <User size={16} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-800">{review.user?.fullName}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={12} className={i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                              ))}
                            </div>
                            {review.isVerifiedPurchase && (
                              <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-medium">Đã mua hàng</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {review.title && <p className="font-medium text-sm text-gray-800 mb-1">{review.title}</p>}
                      {review.content && <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>}
                      <button
                        onClick={() => {
                          if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để đánh giá hữu ích'); return }
                          toggleHelpful.mutate(review.id)
                        }}
                        disabled={toggleHelpful.isPending && toggleHelpful.variables === review.id}
                        className={`mt-2 flex items-center gap-1.5 text-xs font-medium transition-colors
                          ${helpfulState[review.id]?.isHelpful ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'}`}
                      >
                        <ThumbsUp size={13} className={helpfulState[review.id]?.isHelpful ? 'fill-primary-500' : ''} />
                        Hữu ích ({helpfulState[review.id]?.count ?? review.helpfulCount})
                      </button>
                    </div>
                  ))}

                  {/* Pagination reviews */}
                  {reviewData.pagination && reviewData.pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {Array.from({ length: reviewData.pagination.totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setReviewPage(i)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                            ${reviewPage === i ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Star size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Chưa có đánh giá nào</p>
                  <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                  {!isAuthenticated && (
                    <Link to="/login" className="inline-block mt-3 text-sm text-primary-500 hover:underline">
                      Đăng nhập để đánh giá
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related && related.length > 0 && (
        <section>
          <h2 className="section-title">Sản phẩm liên quan</h2>
          <ProductGrid products={related} cols={4} />
        </section>
      )}

      {/* Recently viewed */}
      {(() => {
        const others = (recentlyViewed || []).filter(p => p.id !== product.id)
        return others.length > 0 ? (
          <section className="mt-8">
            <h2 className="section-title">Sản phẩm đã xem</h2>
            <ProductGrid products={others} cols={5} />
          </section>
        ) : null
      })()}
    </div>
  )
}
