import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { orderService, type CreateOrderPayload } from '@/services/orderService'
import { createVNPayPayment, createMoMoPayment, createZaloPayPayment } from '@/services/paymentService'
import { formatPrice } from '@/lib/utils'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import type { ShippingMethod, Store } from '@/types'
import { CreditCard, Banknote, Smartphone, Tag, Truck, Store as StoreIcon } from 'lucide-react'

const schema = z.object({
  shippingName:     z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  shippingPhone:    z.string().regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ'),
  shippingProvince: z.string().min(1, 'Vui lòng chọn tỉnh/thành'),
  shippingDistrict: z.string().min(1, 'Vui lòng nhập quận/huyện'),
  shippingWard:     z.string().min(1, 'Vui lòng nhập phường/xã'),
  shippingAddress:  z.string().min(5, 'Địa chỉ chi tiết tối thiểu 5 ký tự'),
  note:             z.string().optional(),
})
type FormData = z.infer<typeof schema>

const PAYMENT_METHODS = [
  { value: 'cod',           label: 'Tiền mặt (COD)',       icon: Banknote },
  { value: 'bank_transfer', label: 'Chuyển khoản',         icon: CreditCard },
  { value: 'vnpay',         label: 'VNPay',                icon: Smartphone },
  { value: 'momo',          label: 'MoMo',                 icon: Smartphone },
  { value: 'zalopay',       label: 'ZaloPay',              icon: Smartphone },
]

export default function CheckoutPage() {
  const { cart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const buildId = searchParams.get('buildId')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherApplied, setVoucherApplied] = useState<any>(null)
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null)
  const [deliveryMode, setDeliveryMode] = useState<'ship' | 'pickup'>('ship')
  const [pickupStoreId, setPickupStoreId] = useState<number | null>(null)

  const { data: shippingMethods } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: () => api.get<{ data: ShippingMethod[] }>('/shipping-methods').then(r => r.data.data || []),
  })

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.get<{ data: Store[] }>('/stores').then(r => r.data.data || []),
  })

  useEffect(() => {
    if (shippingMethods?.length && shippingMethodId === null) {
      setShippingMethodId(shippingMethods[0].id)
    }
  }, [shippingMethods, shippingMethodId])

  useEffect(() => {
    if (deliveryMode === 'pickup' && stores?.length && pickupStoreId === null) {
      setPickupStoreId(stores[0].id)
    }
  }, [deliveryMode, stores, pickupStoreId])

  const isFreeShippingVoucher = voucherApplied?.discountType === 'free_shipping'
  const selectedMethod = shippingMethods?.find(m => m.id === shippingMethodId)
  const shippingFee = deliveryMode === 'pickup'
    ? 0
    : isFreeShippingVoucher
      ? 0
      : selectedMethod
        ? (selectedMethod.freeThreshold != null && cart.totalAmount >= selectedMethod.freeThreshold
            ? 0 : selectedMethod.baseFee)
        : 30_000

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      shippingName:  user?.fullName || '',
      shippingPhone: user?.phone || '',
    },
  })

  const applyVoucher = useMutation({
    mutationFn: () => api.get(`/vouchers/check?code=${voucherCode}`),
    onSuccess: (res: any) => {
      setVoucherApplied(res.data.data)
      toast.success('Áp dụng voucher thành công')
    },
    onError: () => toast.error('Mã voucher không hợp lệ'),
  })

  const createOrder = useMutation({
    mutationFn: (data: CreateOrderPayload) => orderService.create(data),
    onSuccess: async (res) => {
      const order = res.data.data
      
      // Kiểm tra payment method
      if (paymentMethod === 'vnpay') {
        try {
          // Gọi API tạo VNPay payment URL
          const paymentUrl = await createVNPayPayment(order.id)
          toast.success('Đang chuyển đến trang thanh toán VNPay...')
          
          // Redirect to VNPay
          window.location.href = paymentUrl
        } catch (error: any) {
          toast.error(error.message || 'Không thể tạo thanh toán VNPay')
          console.error('VNPay payment error:', error)
          
          // Fallback - vẫn redirect về order success
          navigate(`/order-success/${order?.orderCode}`)
        }
      } else if (paymentMethod === 'momo') {
        try {
          // Gọi API tạo MoMo payment URL
          const paymentUrl = await createMoMoPayment(order.id)
          toast.success('Đang chuyển đến ví MoMo...')
          
          // Redirect to MoMo
          window.location.href = paymentUrl
        } catch (error: any) {
          toast.error(error.message || 'Không thể tạo thanh toán MoMo')
          console.error('MoMo payment error:', error)
          
          // Fallback
          navigate(`/order-success/${order?.orderCode}`)
        }
      } else if (paymentMethod === 'zalopay') {
        try {
          // Gọi API tạo ZaloPay payment URL
          const paymentUrl = await createZaloPayPayment(order.id)
          toast.success('Đang chuyển đến ví ZaloPay...')
          
          // Redirect to ZaloPay
          window.location.href = paymentUrl
        } catch (error: any) {
          toast.error(error.message || 'Không thể tạo thanh toán ZaloPay')
          console.error('ZaloPay payment error:', error)
          
          // Fallback
          navigate(`/order-success/${order?.orderCode}`)
        }
      } else {
        // COD hoặc bank_transfer
        toast.success('Đặt hàng thành công!')
        navigate(`/order-success/${order?.orderCode}`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Đặt hàng thất bại')
    }
  })

  const voucherDiscount = !voucherApplied || isFreeShippingVoucher
    ? 0
    : voucherApplied.discountType === 'percent'
      ? cart.totalAmount * voucherApplied.discountValue / 100
      : voucherApplied.discountValue
  const autoDiscount = cart.autoDiscount || 0
  const discount = Math.min(voucherDiscount + autoDiscount, cart.totalAmount)

  const total = cart.totalAmount + shippingFee - discount

  const onSubmit = (formData: FormData) => {
    createOrder.mutate({
      ...formData,
      paymentMethod,
      voucherCode: voucherApplied ? voucherCode : undefined,
      buildId: buildId ? Number(buildId) : undefined,
      shippingMethodId: deliveryMode === 'ship' ? (shippingMethodId ?? undefined) : undefined,
      pickupStoreId: deliveryMode === 'pickup' ? (pickupStoreId ?? undefined) : undefined,
    })
  }

  if (cart.items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <p className="text-gray-500 mb-4">Giỏ hàng trống</p>
        <button onClick={() => navigate('/')} className="btn-primary">Tiếp tục mua sắm</button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4">
            {/* Shipping info */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Thông tin giao hàng</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                  <input {...register('shippingName')} className="input" placeholder="Nguyễn Văn A" />
                  {errors.shippingName && <p className="text-red-500 text-xs mt-1">{errors.shippingName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input {...register('shippingPhone')} className="input" placeholder="0901234567" />
                  {errors.shippingPhone && <p className="text-red-500 text-xs mt-1">{errors.shippingPhone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố *</label>
                  <input {...register('shippingProvince')} className="input" placeholder="Hà Nội" />
                  {errors.shippingProvince && <p className="text-red-500 text-xs mt-1">{errors.shippingProvince.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện *</label>
                  <input {...register('shippingDistrict')} className="input" placeholder="Cầu Giấy" />
                  {errors.shippingDistrict && <p className="text-red-500 text-xs mt-1">{errors.shippingDistrict.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã *</label>
                  <input {...register('shippingWard')} className="input" placeholder="Dịch Vọng" />
                  {errors.shippingWard && <p className="text-red-500 text-xs mt-1">{errors.shippingWard.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết *</label>
                  <input {...register('shippingAddress')} className="input" placeholder="Số nhà, tên đường..." />
                  {errors.shippingAddress && <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú đơn hàng</label>
                  <textarea {...register('note')} className="input h-20 resize-none" placeholder="Ghi chú thêm (tùy chọn)..." />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Phương thức thanh toán</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <label key={value}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors
                      ${paymentMethod === value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <input type="radio" name="payment" value={value}
                      checked={paymentMethod === value}
                      onChange={() => setPaymentMethod(value)}
                      className="sr-only"
                    />
                    <Icon size={20} className={paymentMethod === value ? 'text-primary-500' : 'text-gray-400'} />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Order summary */}
          <div className="space-y-4">
            {/* Cart items */}
            <div className="card p-5">
              <h2 className="font-bold text-lg mb-4">Đơn hàng ({cart.totalItems} sản phẩm)</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.items.map(item => (
                  <div key={item.productId} className="flex gap-3">
                    <img src={item.thumbnail || '/placeholder.png'} alt={item.productName}
                      className="w-12 h-12 object-contain bg-gray-50 rounded-lg border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary-500 flex-shrink-0">{formatPrice(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Voucher */}
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Tag size={16} /> Mã giảm giá</h3>
              <div className="flex gap-2">
                <input
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã voucher"
                  className="input flex-1"
                  disabled={!!voucherApplied}
                />
                {voucherApplied ? (
                  <button type="button" onClick={() => { setVoucherApplied(null); setVoucherCode('') }}
                    className="btn-outline px-3 py-2 text-sm">Hủy</button>
                ) : (
                  <button type="button" onClick={() => applyVoucher.mutate()}
                    disabled={!voucherCode || applyVoucher.isPending}
                    className="btn-primary px-4 py-2 text-sm">Áp dụng</button>
                )}
              </div>
              {voucherApplied && (
                <p className="text-green-600 text-xs mt-2">
                  ✓ Đã áp dụng: {isFreeShippingVoucher ? 'miễn phí vận chuyển' : `giảm ${formatPrice(voucherDiscount)}`}
                </p>
              )}
            </div>

            {/* Delivery mode */}
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Truck size={16} /> Nhận hàng</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button type="button" onClick={() => setDeliveryMode('ship')}
                  className={`py-2 rounded-lg text-sm font-medium border-2 transition-colors
                    ${deliveryMode === 'ship' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-600'}`}>
                  Giao tận nơi
                </button>
                <button type="button" onClick={() => setDeliveryMode('pickup')}
                  className={`py-2 rounded-lg text-sm font-medium border-2 transition-colors
                    ${deliveryMode === 'pickup' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-600'}`}>
                  Nhận tại showroom
                </button>
              </div>

              {deliveryMode === 'ship' && !!shippingMethods?.length && (
                <div className="space-y-2">
                  {shippingMethods.map(m => (
                    <label key={m.id}
                      className={`flex items-center justify-between gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors
                        ${shippingMethodId === m.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input type="radio" name="shippingMethod" checked={shippingMethodId === m.id}
                          onChange={() => setShippingMethodId(m.id)} className="sr-only" />
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          {m.estimatedDays && <p className="text-xs text-gray-400">{m.estimatedDays}</p>}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary-500">
                        {isFreeShippingVoucher || (m.freeThreshold != null && cart.totalAmount >= m.freeThreshold)
                          ? 'Miễn phí' : formatPrice(m.baseFee)}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {deliveryMode === 'pickup' && (
                <div>
                  {!stores?.length ? (
                    <p className="text-sm text-gray-400">Đang tải danh sách showroom...</p>
                  ) : (
                    <div className="space-y-2">
                      {stores.map(s => (
                        <label key={s.id}
                          className={`flex items-start gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors
                            ${pickupStoreId === s.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <input type="radio" name="pickupStore" checked={pickupStoreId === s.id}
                            onChange={() => setPickupStoreId(s.id)} className="sr-only mt-0.5" />
                          <StoreIcon size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.address}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="card p-5 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tạm tính:</span><span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Phí vận chuyển:</span><span>{formatPrice(shippingFee)}</span>
              </div>
              {autoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Khuyến mãi tự động:</span><span>-{formatPrice(autoDiscount)}</span>
                </div>
              )}
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Voucher:</span><span>-{formatPrice(voucherDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Tổng cộng:</span>
                <span className="text-primary-500">{formatPrice(total)}</span>
              </div>
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="btn-primary w-full py-3 text-base"
              >
                {createOrder.isPending ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Bằng cách đặt hàng, bạn đồng ý với điều khoản dịch vụ của KinhDuanPC
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
