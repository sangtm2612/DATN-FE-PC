// ─── Auth ───────────────────────────────────────────────────
export interface User {
  id: number
  fullName: string
  email: string
  phone: string
  role: 'customer' | 'staff' | 'technician' | 'admin'
  avatarUrl?: string
  emailVerified: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: User
}

// ─── Category ────────────────────────────────────────────────
export interface Category {
  id: number
  name: string
  slug: string
  iconUrl?: string
  imageUrl?: string
  description?: string
  sortOrder: number
  isActive: boolean
  children?: Category[]
}

// ─── Brand ──────────────────────────────────────────────────
export interface Brand {
  id: number
  name: string
  slug: string
  logoUrl?: string
  website?: string
}

// ─── Product ─────────────────────────────────────────────────
export interface ProductImage {
  id: number
  imageUrl: string
  altText?: string
  isPrimary: boolean
  sortOrder: number
}

export interface AttributeItem {
  name: string
  value: string
  unit?: string
}

export interface AttributeGroup {
  groupName: string
  attributes: AttributeItem[]
}

export interface Product {
  id: number
  name: string
  slug: string
  sku?: string
  shortDesc?: string
  description?: string
  thumbnail?: string
  price: number
  originalPrice?: number
  isOnSale: boolean
  discountPercent?: number
  stockQty: number
  soldQty: number
  viewCount: number
  ratingAvg: number
  ratingCount: number
  warrantyMonths: number
  warrantyText?: string
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  createdAt: string
  category?: { id: number; name: string; slug: string }
  brand?: { id: number; name: string; slug: string; logoUrl?: string }
  images?: ProductImage[]
  attributeGroups?: AttributeGroup[]
  tags?: string[]
}

export interface Tag {
  id: number
  name: string
  slug: string
}

// ─── Cart ────────────────────────────────────────────────────
export interface CartItem {
  productId: number
  productName: string
  productSlug: string
  thumbnail?: string
  sku?: string
  unitPrice: number
  currentPrice: number
  quantity: number
  stockQty: number
  subtotal: number
}

export interface Cart {
  items: CartItem[]
  totalItems: number
  totalAmount: number
}

// ─── Order ──────────────────────────────────────────────────
export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing'
  | 'shipping' | 'delivered' | 'completed'
  | 'cancelled' | 'refunded'

export type PaymentMethod =
  | 'cod' | 'bank_transfer' | 'vnpay' | 'momo' | 'zalopay' | 'installment'

export interface OrderItem {
  id: number
  productId: number
  productName: string
  productSku?: string
  productImage?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  warrantyMonths: number
}

export interface Order {
  id: number
  orderCode: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: string
  shippingName: string
  shippingPhone: string
  shippingProvince: string
  shippingDistrict: string
  shippingWard: string
  shippingAddress: string
  subtotal: number
  shippingFee: number
  discountAmount: number
  totalAmount: number
  voucherCode?: string
  note?: string
  cancelledReason?: string
  createdAt: string
  confirmedAt?: string
  shippedAt?: string
  deliveredAt?: string
  completedAt?: string
  cancelledAt?: string
  items: OrderItem[]
}

// ─── Review ─────────────────────────────────────────────────
export interface Review {
  id: number
  rating: number
  title?: string
  content?: string
  isVerifiedPurchase: boolean
  helpfulCount: number
  createdAt: string
  user: { id: number; fullName: string; avatarUrl?: string }
  images?: { id: number; imageUrl: string }[]
}

// ─── Warranty ────────────────────────────────────────────────
export interface Warranty {
  id: number
  serialNumber?: string
  purchaseDate: string
  warrantyExpiresAt: string
  warrantyMonths: number
  status: 'active' | 'expired' | 'voided' | 'in_service'
  product: { id: number; name: string; thumbnail?: string }
}

// ─── Store ──────────────────────────────────────────────────
export interface Store {
  id: number
  name: string
  slug: string
  address: string
  province: string
  district?: string
  phone?: string
  email?: string
  openHours?: string
  googleMapsUrl?: string
  lat?: number
  lng?: number
  isActive?: boolean
  images?: { id: number; imageUrl: string }[]
}

// ─── Banner ─────────────────────────────────────────────────
export interface Banner {
  id: number
  title: string
  imageUrl: string
  mobileImageUrl?: string
  linkUrl?: string
  position: string
  sortOrder: number
}

// ─── Blog ───────────────────────────────────────────────────
export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string
  content?: string
  thumbnailUrl?: string
  viewCount: number
  isPublished?: boolean
  publishedAt?: string
  blogCategory?: { id: number; name: string; slug: string }
  author?: { id: number; fullName: string }
}

// ─── Voucher ────────────────────────────────────────────────
export interface Voucher {
  id: number
  code: string
  name?: string
  discountType: 'percent' | 'fixed_amount' | 'free_shipping'
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
}

// ─── API ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: { code: string; message: string }
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}
