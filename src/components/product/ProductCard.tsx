import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartService } from '@/services/cartService'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'
import api from '@/lib/axios'

interface Props {
  product: Product
  showQuickAdd?: boolean
}

export default function ProductCard({ product, showQuickAdd = true }: Props) {
  const { setCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const addToCart = useMutation({
    mutationFn: () => cartService.addItem(product.id, 1),
    onSuccess: (res) => {
      if (res.data.data) setCart(res.data.data)
      toast.success('Đã thêm vào giỏ hàng')
    },
  })

  const toggleWishlist = useMutation({
    mutationFn: () => api.post(`/wishlist/${product.id}`),
    onSuccess: (res: any) => toast.success(res.data.message),
  })

  return (
    <div className="card group hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <Link to={`/san-pham/${product.slug}`}>
          <img
            src={product.thumbnail || '/placeholder.png'}
            alt={product.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isOnSale && product.discountPercent && (
            <span className="badge-sale">-{product.discountPercent}%</span>
          )}
          {product.isNew && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">MỚI</span>
          )}
          {product.stockQty === 0 && (
            <span className="bg-gray-500 text-white text-xs font-bold px-2 py-0.5 rounded">HẾT HÀNG</span>
          )}
        </div>

        {/* Wishlist */}
        {isAuthenticated && (
          <button
            onClick={() => toggleWishlist.mutate()}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary-500"
          >
            <Heart size={14} />
          </button>
        )}

        {/* Quick add */}
        {showQuickAdd && product.stockQty > 0 && (
          <button
            onClick={() => addToCart.mutate()}
            disabled={addToCart.isPending}
            className="absolute bottom-2 left-2 right-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold
                       py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200
                       flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <ShoppingCart size={13} />
            {addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ'}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        {/* Brand */}
        {product.brand && (
          <span className="text-xs text-gray-400 uppercase tracking-wide">{product.brand.name}</span>
        )}

        {/* Name */}
        <Link to={`/san-pham/${product.slug}`} className="text-sm font-medium text-gray-800 hover:text-primary-500 line-clamp-2 flex-1">
          {product.name}
        </Link>

        {/* Rating */}
        {product.ratingCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={10} className={i <= Math.round(product.ratingAvg)
                  ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-xs text-gray-400">({product.ratingCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="price text-base">{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="price-original">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* Warranty */}
        {product.warrantyMonths > 0 && (
          <p className="text-xs text-gray-400">
            Bảo hành: {product.warrantyText || `${product.warrantyMonths} tháng`}
          </p>
        )}
      </div>
    </div>
  )
}
