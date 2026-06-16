import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { productService } from '@/services/productService'
import { cartService } from '@/services/cartService'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import ProductGrid from '@/components/product/ProductGrid'
import { ShoppingCart, Zap, Heart, Star, Shield, Truck, RotateCcw, ChevronRight, Minus, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc')
  const { setCart, setOpen } = useCartStore()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug!).then(r => r.data.data),
  })

  const { data: related } = useQuery({
    queryKey: ['related', product?.id],
    queryFn: () => productService.getRelated(product!.id).then(r => r.data.data || []),
    enabled: !!product?.id,
  })

  const addToCart = useMutation({
    mutationFn: () => cartService.addItem(product!.id, quantity),
    onSuccess: (res) => {
      if (res.data.data) { setCart(res.data.data); setOpen(true) }
      toast.success('Đã thêm vào giỏ hàng')
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
            <div className="text-center py-8 text-gray-400">
              <Star size={48} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có đánh giá nào</p>
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
    </div>
  )
}
