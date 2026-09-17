import { useCartStore } from '@/store/cartStore'
import { cartService } from '@/services/cartService'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CartDrawer() {
  const { cart, isOpen, setOpen, setCart } = useCartStore()
  const navigate = useNavigate()

  const updateItem = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => cartService.updateItem(id, qty),
    onSuccess: (res) => { if (res.data.data) setCart(res.data.data) },
  })

  const removeItem = useMutation({
    mutationFn: (id: number) => cartService.removeItem(id),
    onSuccess: (res) => { if (res.data.data) setCart(res.data.data); toast.success('Đã xóa khỏi giỏ') },
  })

  const handleCheckout = () => {
    setOpen(false)
    navigate('/checkout')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary-500" />
            Giỏ hàng ({cart.totalItems})
          </h2>
          <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
              <p>Giỏ hàng trống</p>
              <button onClick={() => setOpen(false)} className="mt-4 text-primary-500 text-sm hover:underline">
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            cart.items.map(item => (
              <div key={item.productId} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <Link to={`/san-pham/${item.productSlug}`} onClick={() => setOpen(false)}>
                  <img src={item.thumbnail || '/placeholder.png'} alt={item.productName}
                    className="w-16 h-16 object-contain bg-white rounded-lg border" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/san-pham/${item.productSlug}`} onClick={() => setOpen(false)}
                    className="text-sm font-medium text-gray-800 hover:text-primary-500 line-clamp-2">
                    {item.productName}
                  </Link>
                  <div className="mt-0.5 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-primary-500 font-bold text-sm">{formatPrice(item.unitPrice)}</span>
                      {item.originalPrice && item.originalPrice > item.unitPrice && (
                        <>
                          <span className="text-xs text-gray-400 line-through">{formatPrice(item.originalPrice)}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-1 rounded font-medium">
                            -{Math.round((item.originalPrice - item.unitPrice) / item.originalPrice * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                    {item.promotionLabel && item.promotionDiscount && item.promotionDiscount > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium leading-none">{item.promotionLabel}</span>
                        <span className="text-orange-500">-{formatPrice(item.promotionDiscount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => updateItem.mutate({ id: item.productId, qty: item.quantity - 1 })}
                      disabled={item.quantity <= 1}
                      className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-200 disabled:opacity-40"
                    ><Minus size={12} /></button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateItem.mutate({ id: item.productId, qty: item.quantity + 1 })}
                      disabled={item.quantity >= item.stockQty}
                      className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-200 disabled:opacity-40"
                    ><Plus size={12} /></button>
                    <button
                      onClick={() => removeItem.mutate(item.productId)}
                      className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                    ><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t px-5 py-4 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="font-bold text-lg price">{formatPrice(cart.totalAmount)}</span>
              </div>
              {cart.promotionBreakdown && cart.promotionBreakdown.length > 0
                ? cart.promotionBreakdown.map(pb => (
                    <div key={pb.label} className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block flex-shrink-0" />
                        {pb.label}:
                      </span>
                      <span>-{formatPrice(pb.totalDiscount)}</span>
                    </div>
                  ))
                : !!cart.autoDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Khuyến mãi:</span>
                      <span>-{formatPrice(cart.autoDiscount)}</span>
                    </div>
                  )
              }
              {!!cart.autoDiscount && (
                <div className="flex items-center justify-between font-semibold border-t pt-1.5">
                  <span>Sau KM:</span>
                  <span className="text-primary-500">{formatPrice(cart.totalAmount - cart.autoDiscount)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center">Phí vận chuyển sẽ được tính ở bước thanh toán</p>
            <button onClick={handleCheckout} className="btn-primary w-full text-center py-3 text-base">
              Tiến hành thanh toán
            </button>
            <button onClick={() => setOpen(false)}
              className="w-full text-center text-sm text-gray-500 hover:text-primary-500 transition-colors py-1">
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </>
  )
}
