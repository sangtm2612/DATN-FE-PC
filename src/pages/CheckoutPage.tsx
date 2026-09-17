import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { orderService, type CreateOrderPayload } from '@/services/orderService'
import { createVNPayPayment, createMoMoPayment, createZaloPayPayment } from '@/services/paymentService'
import { getOrderConfig } from '@/services/configService'
import { formatPrice, getOrCreateSessionId } from '@/lib/utils'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import type { ShippingMethod, Store } from '@/types'
import { CreditCard, Banknote, Smartphone, Tag, Truck } from 'lucide-react'
import AddressForm from '@/components/checkout/AddressForm'

const schema = z.object({
  shippingName:     z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  shippingPhone:    z.string().regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ'),
  guestEmail:       z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  shippingProvince: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố'),
  shippingDistrict: z.string().optional().default(''),
  shippingWard:     z.string().min(1, 'Vui lòng chọn phường/xã/thị trấn'),
  shippingAddress:  z.string().min(5, 'Địa chỉ chi tiết tối thiểu 5 ký tự'),
  note:             z.string().optional(),
})
type FormData = z.infer<typeof schema>

const PAYMENT_METHODS = [
  { value: 'cod',           label: 'Tiền mặt (COD)',       icon: Banknote },
  // { value: 'bank_transfer', label: 'Chuyển khoản',         icon: CreditCard }, // Ẩn tạm thời
  { value: 'vnpay',         label: 'VNPay',                icon: Smartphone },
  // { value: 'momo',          label: 'MoMo',                 icon: Smartphone }, // Ẩn tạm thời
  { value: 'zalopay',       label: 'ZaloPay',              icon: Smartphone },
]

export default function CheckoutPage() {
  const { cart, setCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const buildId = searchParams.get('buildId')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<'vnpay' | 'zalopay'>('vnpay')
  const [voucherCode, setVoucherCode] = useState('')
  const isSubmittingRef = useRef(false) // Prevent double submission
  
  // Lấy config từ backend
  const { data: orderConfig } = useQuery({
    queryKey: ['orderConfig'],
    queryFn: getOrderConfig,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  })
  
  const COD_DEPOSIT_FEE = orderConfig?.codDepositAmount || 100_000 // Fallback to 100k
  const [voucherApplied, setVoucherApplied] = useState<any>(null)
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null)
  const [deliveryMode, setDeliveryMode] = useState<'ship' | 'pickup'>('ship')
  const [pickupStoreId, setPickupStoreId] = useState<number | null>(null)

  // Hardcoded shipping methods (không call API nữa)
  const shippingMethods: ShippingMethod[] = [
    {
      id: 1,
      name: 'Giao hàng tiêu chuẩn',
      description: 'Giao hàng trong 3-5 ngày',
      baseFee: 30000,
      freeThreshold: 1000000,
      estimatedDays: '3-5 ngày',
      isActive: true,
    },
    {
      id: 2,
      name: 'Giao hàng nhanh',
      description: 'Giao hàng trong 1-2 ngày',
      baseFee: 50000,
      freeThreshold: 2000000,
      estimatedDays: '1-2 ngày',
      isActive: true,
    },
  ]

  // Tạm thời ẩn tính năng pickup tại showroom
  // const { data: stores } = useQuery({
  //   queryKey: ['stores'],
  //   queryFn: () => api.get<{ data: Store[] }>('/stores').then(r => r.data.data || []),
  // })

  useEffect(() => {
    if (shippingMethods?.length && shippingMethodId === null) {
      setShippingMethodId(shippingMethods[0].id)
    }
  }, [shippingMethodId])

  // Tạm thời ẩn tính năng pickup tại showroom
  // useEffect(() => {
  //   if (deliveryMode === 'pickup' && stores?.length && pickupStoreId === null) {
  //     setPickupStoreId(stores[0].id)
  //   }
  // }, [deliveryMode, stores, pickupStoreId])

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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      shippingName:  user?.fullName || '',
      shippingPhone: user?.phone || '',
      guestEmail:    user?.email || '', // Pre-fill email if user is logged in
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
      
      // KHÔNG clear cart ngay - sẽ clear sau khi redirect hoặc khi callback thành công
      // setCart({ items: [], totalItems: 0, totalAmount: 0 })
      
      // Nếu chọn COD: Phải thanh toán cọc 100k qua ví điện tử
      if (paymentMethod === 'cod') {
        try {
          let paymentUrl: string
          
          if (depositPaymentMethod === 'vnpay') {
            // Gọi API tạo VNPay payment với số tiền cọc
            paymentUrl = await createVNPayPayment(order.id, COD_DEPOSIT_FEE)
            toast.success('Đang chuyển đến trang thanh toán cọc VNPay...')
          } else {
            // Gọi API tạo ZaloPay payment với số tiền cọc
            paymentUrl = await createZaloPayPayment(order.id, COD_DEPOSIT_FEE)
            toast.success('Đang chuyển đến ví ZaloPay để thanh toán cọc...')
          }
          
          // Clear cart TRƯỚC KHI redirect
          setCart({ items: [], totalItems: 0, totalAmount: 0 })
          
          // Redirect to payment gateway
          window.location.href = paymentUrl
        } catch (error: any) {
          toast.error(
            'Không thể khởi tạo thanh toán cọc. Đơn hàng sẽ tự động hủy sau 15 phút nếu không thanh toán.',
            { duration: 6000 }
          )
          console.error('Deposit payment error:', error)
          // Đơn đang ở pending_deposit — điều hướng tới trang tra cứu đơn hàng thay vì trang success
          navigate(`/tra-don-hang?orderCode=${order?.orderCode}&phone=${encodeURIComponent(order?.shippingPhone || '')}`)
        }
      }
      // Nếu chọn VNPay: Thanh toán toàn bộ
      else if (paymentMethod === 'vnpay') {
        try {
          const paymentUrl = await createVNPayPayment(order.id)
          toast.success('Đang chuyển đến trang thanh toán VNPay...')
          
          // Clear cart TRƯỚC KHI redirect
          setCart({ items: [], totalItems: 0, totalAmount: 0 })
          
          window.location.href = paymentUrl
        } catch (error: any) {
          toast.error(error.message || 'Không thể tạo thanh toán VNPay')
          console.error('VNPay payment error:', error)
          navigate(`/order-success/${order?.orderCode}`)
        }
      }
      // Nếu chọn ZaloPay: Thanh toán toàn bộ
      else if (paymentMethod === 'zalopay') {
        try {
          const paymentUrl = await createZaloPayPayment(order.id)
          toast.success('Đang chuyển đến ví ZaloPay...')
          
          // Clear cart TRƯỚC KHI redirect
          setCart({ items: [], totalItems: 0, totalAmount: 0 })
          
          window.location.href = paymentUrl
        } catch (error: any) {
          toast.error(error.message || 'Không thể tạo thanh toán ZaloPay')
          console.error('ZaloPay payment error:', error)
          navigate(`/order-success/${order?.orderCode}`)
        }
      } else {
        // Các phương thức khác (nếu có)
        setCart({ items: [], totalItems: 0, totalAmount: 0 })
        toast.success('Đặt hàng thành công!')
        navigate(`/order-success/${order?.orderCode}`)
      }
    },
    onError: (error: any) => {
      isSubmittingRef.current = false // Reset flag on error
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
    // Prevent double submission
    if (isSubmittingRef.current) {
      console.warn('Already submitting, ignoring duplicate request')
      return
    }
    
    isSubmittingRef.current = true
    const sessionId = getOrCreateSessionId()
    createOrder.mutate({
      ...formData,
      sessionId,  // Add sessionId for guest checkout
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
                
                {/* Email field - especially for guest checkout */}
                {!user && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email {!user && <span className="text-gray-500">(để nhận thông tin đơn hàng)</span>}
                    </label>
                    <input 
                      {...register('guestEmail')} 
                      type="email" 
                      className="input" 
                      placeholder="email@example.com" 
                    />
                    {errors.guestEmail && <p className="text-red-500 text-xs mt-1">{errors.guestEmail.message}</p>}
                  </div>
                )}
                
                {/* Address Form Component */}
                <AddressForm register={register} errors={errors} setValue={setValue} watch={watch} />
                
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
              
              {/* Hiển thị form chọn phương thức thanh toán cọc khi chọn COD */}
              {paymentMethod === 'cod' && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-800 mb-3">
                    ⚠️ Yêu cầu cọc trước {formatPrice(COD_DEPOSIT_FEE)}
                  </p>
                  <p className="text-xs text-amber-700 mb-3">
                    Bạn cần thanh toán cọc trước để xác nhận đơn hàng. Phần còn lại sẽ thanh toán khi nhận hàng.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Chọn phương thức thanh toán cọc:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors
                          ${depositPaymentMethod === 'vnpay' ? 'border-primary-500 bg-white' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                      >
                        <input 
                          type="radio" 
                          name="depositPayment" 
                          value="vnpay"
                          checked={depositPaymentMethod === 'vnpay'}
                          onChange={() => setDepositPaymentMethod('vnpay')}
                          className="sr-only"
                        />
                        <Smartphone size={16} className={depositPaymentMethod === 'vnpay' ? 'text-primary-500' : 'text-gray-400'} />
                        <span className="text-sm font-medium">VNPay</span>
                      </label>
                      <label
                        className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors
                          ${depositPaymentMethod === 'zalopay' ? 'border-primary-500 bg-white' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                      >
                        <input 
                          type="radio" 
                          name="depositPayment" 
                          value="zalopay"
                          checked={depositPaymentMethod === 'zalopay'}
                          onChange={() => setDepositPaymentMethod('zalopay')}
                          className="sr-only"
                        />
                        <Smartphone size={16} className={depositPaymentMethod === 'zalopay' ? 'text-primary-500' : 'text-gray-400'} />
                        <span className="text-sm font-medium">ZaloPay</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right - Order summary */}
          <div className="space-y-4">
            {/* Cart items */}
            <div className="card p-5">
              <h2 className="font-bold text-lg mb-4">Đơn hàng ({cart.totalItems} sản phẩm)</h2>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {cart.items.map(item => {
                  const hasSaleDiscount = item.originalPrice && item.originalPrice > item.unitPrice
                  const saleDiscountPct = hasSaleDiscount
                    ? Math.round((item.originalPrice! - item.unitPrice) / item.originalPrice! * 100)
                    : 0
                  const hasPromoDiscount = !!(item.promotionLabel && item.promotionDiscount && item.promotionDiscount > 0)
                  return (
                    <div key={item.productId} className="flex gap-3">
                      <img src={item.thumbnail || '/placeholder.png'} alt={item.productName}
                        className="w-12 h-12 object-contain bg-gray-50 rounded-lg border flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        {/* Giá gốc + badge giảm giá sale */}
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500">x{item.quantity}</span>
                          {hasSaleDiscount ? (
                            <>
                              <span className="text-xs text-gray-400 line-through">{formatPrice(item.originalPrice!)}/sp</span>
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">-{saleDiscountPct}%</span>
                              <span className="text-xs text-gray-700 font-medium">{formatPrice(item.unitPrice)}/sp</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">{formatPrice(item.unitPrice)}/sp</span>
                          )}
                        </div>
                        {/* Badge khuyến mãi + số tiền giảm */}
                        {hasPromoDiscount && (
                          <p className="text-xs flex items-center gap-1 mt-0.5">
                            <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium leading-none">{item.promotionLabel}</span>
                            <span className="text-orange-500">-{formatPrice(item.promotionDiscount!)}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-semibold text-primary-500">{formatPrice(item.subtotal)}</p>
                        {hasSaleDiscount && (
                          <p className="text-xs text-gray-400 line-through">{formatPrice(item.originalPrice! * item.quantity)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
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
                  Đã áp dụng: {isFreeShippingVoucher ? 'miễn phí vận chuyển' : `giảm ${formatPrice(voucherDiscount)}`}
                </p>
              )}
            </div>

            {/* Delivery mode - CHỈ GIAO TẬN NƠI */}
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Truck size={16} /> Phương thức giao hàng</h3>
              
              {!!shippingMethods?.length && (
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
            </div>

            {/* Total */}
            <div className="card p-5 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tạm tính:</span><span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Phí vận chuyển:</span><span>{formatPrice(shippingFee)}</span>
              </div>
              {cart.promotionBreakdown && cart.promotionBreakdown.length > 0
                ? cart.promotionBreakdown.map(pb => (
                    <div key={pb.label} className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-400 inline-block flex-shrink-0" />
                        {pb.label}:
                      </span>
                      <span>-{formatPrice(pb.totalDiscount)}</span>
                    </div>
                  ))
                : autoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Khuyến mãi tự động:</span><span>-{formatPrice(autoDiscount)}</span>
                    </div>
                  )
              }
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Voucher:</span><span>-{formatPrice(voucherDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Tổng cộng:</span>
                <span className="text-primary-500">{formatPrice(total)}</span>
              </div>
              
              {/* Hiển thị thông tin thanh toán cho COD */}
              {paymentMethod === 'cod' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800 font-medium">Thanh toán ngay (cọc):</span>
                    <span className="text-blue-900 font-bold">{formatPrice(COD_DEPOSIT_FEE)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Thanh toán khi nhận:</span>
                    <span className="text-blue-800 font-semibold">{formatPrice(total - COD_DEPOSIT_FEE)}</span>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="btn-primary w-full py-3 text-base"
              >
                {createOrder.isPending ? 'Đang xử lý...' : 
                  paymentMethod === 'cod' ? `Thanh toán cọc ${formatPrice(COD_DEPOSIT_FEE)}` : 'Đặt hàng'}
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
