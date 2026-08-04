import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { cartService } from '@/services/cartService'
import { useCartStore } from '@/store/cartStore'
import { useMutation } from '@tanstack/react-query'
import { formatPrice } from '@/lib/utils'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { cart, setCart } = useCartStore()
  const navigate = useNavigate()

  const { refetch } = useQuery({
    queryKey: ['cart-page'],
    queryFn: () => cartService.getCart().then(r => { if (r.data.data) setCart(r.data.data); return r.data.data }),
  })

  const updateItem = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => cartService.updateItem(id, qty),
    onSuccess: (res) => { if (res.data.data) setCart(res.data.data) },
  })

  const removeItem = useMutation({
    mutationFn: (id: number) => cartService.removeItem(id),
    onSuccess: (res) => { if (res.data.data) setCart(res.data.data); toast.success('Đã xóa sản phẩm') },
  })

  const clearCart = useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: (res) => { if (res.data.data) setCart(res.data.data); toast.success('Đã xóa giỏ hàng') },
  })

  if (cart.items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
        <Link to="/products" className="btn-primary px-8 py-3">Khám phá sản phẩm</Link>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Giỏ hàng ({cart.totalItems} sản phẩm)</h1>
        <button onClick={() => clearCart.mutate()} className="text-sm text-red-500 hover:underline">
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map(item => (
            <div key={item.productId} className="card p-4 flex gap-4">
              <Link to={`/san-pham/${item.productSlug}`}>
                <img src={item.thumbnail || '/placeholder.png'} alt={item.productName}
                  className="w-20 h-20 object-contain bg-gray-50 rounded-xl border flex-shrink-0" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/san-pham/${item.productSlug}`}
                  className="font-semibold text-gray-800 hover:text-primary-500 line-clamp-2 block">
                  {item.productName}
                </Link>
                {item.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                <p className="text-primary-500 font-bold mt-1">{formatPrice(item.unitPrice)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateItem.mutate({ id: item.productId, qty: item.quantity - 1 })}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    ><Minus size={13} /></button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateItem.mutate({ id: item.productId, qty: item.quantity + 1 })}
                      disabled={item.quantity >= item.stockQty}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    ><Plus size={13} /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">{formatPrice(item.subtotal)}</span>
                    <button onClick={() => removeItem.mutate(item.productId)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="card p-6 sticky top-24 space-y-4">
            <h3 className="font-bold text-lg">Tóm tắt đơn hàng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({cart.totalItems} sản phẩm):</span>
                <span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển:</span>
                <span className="text-green-600">Tính lúc thanh toán</span>
              </div>
              {!!cart.autoDiscount && (
                <div className="flex justify-between text-green-600">
                  <span>Khuyến mãi tự động:</span>
                  <span>-{formatPrice(cart.autoDiscount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Tổng:</span>
              <span className="text-primary-500">{formatPrice(cart.totalAmount - (cart.autoDiscount || 0))}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              Tiến hành thanh toán <ArrowRight size={16} />
            </button>
            <Link to="/products" className="block text-center text-sm text-gray-500 hover:text-primary-500 transition-colors">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
