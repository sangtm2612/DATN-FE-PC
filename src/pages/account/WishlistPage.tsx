import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingCart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { cartService } from '@/services/cartService'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

interface WishlistItem {
  productId: number
  productName: string
  slug: string
  price: number
  discountedPrice?: number
  thumbnailUrl: string
  inStock: boolean
  stockQuantity: number
  addedAt: string
}

export default function WishlistPage() {
  const qc = useQueryClient()
  const { setCart } = useCartStore()

  const { data: wishlists, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get<{ data: WishlistItem[] }>('/wishlist').then(r => r.data.data || []),
  })

  const remove = useMutation({
    mutationFn: (productId: number) => api.post(`/wishlist/${productId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wishlist'] }); toast.success('Đã xóa khỏi yêu thích') },
  })

  const addToCart = useMutation({
    mutationFn: (productId: number) => cartService.addItem(productId, 1),
    onSuccess: (res) => { if (res.data.data) setCart(res.data.data); toast.success('Đã thêm vào giỏ hàng') },
  })

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Heart size={20} className="text-primary-500" /> Sản phẩm yêu thích
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : !wishlists?.length ? (
        <div className="text-center py-16 text-gray-400">
          <Heart size={48} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có sản phẩm yêu thích</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {wishlists.map((item: WishlistItem) => (
            <div key={item.productId} className="card group">
              <div className="relative aspect-square bg-gray-50">
                <Link to={`/san-pham/${item.slug}`}>
                  <img 
                    src={item.thumbnailUrl || '/placeholder.png'} 
                    alt={item.productName} 
                    className="w-full h-full object-contain p-3" 
                  />
                </Link>
                <button 
                  onClick={() => remove.mutate(item.productId)}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
                
                {/* Stock status badge */}
                {!item.inStock && (
                  <span className="absolute top-2 left-2 bg-gray-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                    HẾT HÀNG
                  </span>
                )}
              </div>
              
              <div className="p-3">
                <Link 
                  to={`/san-pham/${item.slug}`} 
                  className="text-sm font-medium text-gray-800 hover:text-primary-500 line-clamp-2"
                >
                  {item.productName}
                </Link>
                
                {/* Price */}
                <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                  <span className="price text-sm">
                    {formatPrice(item.discountedPrice || item.price)}
                  </span>
                  {item.discountedPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(item.price)}
                    </span>
                  )}
                </div>
                
                {/* Add to cart button */}
                <button 
                  onClick={() => addToCart.mutate(item.productId)}
                  disabled={!item.inStock || addToCart.isPending}
                  className="mt-2 w-full btn-outline text-xs py-1.5 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={13} />
                  {!item.inStock ? 'Hết hàng' : addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
