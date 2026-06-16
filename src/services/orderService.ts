import api from '@/lib/axios'
import type { Order, ApiResponse } from '@/types'

export interface CreateOrderPayload {
  shippingName: string
  shippingPhone: string
  shippingProvince: string
  shippingDistrict: string
  shippingWard: string
  shippingAddress: string
  paymentMethod: string
  shippingMethodId?: number
  pickupStoreId?: number
  voucherCode?: string
  note?: string
}

export const orderService = {
  create: (data: CreateOrderPayload) =>
    api.post<ApiResponse<Order>>('/orders', data),

  track: (orderCode: string, phone: string) =>
    api.get<ApiResponse<Order>>(`/orders/track?orderCode=${orderCode}&phone=${phone}`),

  getMyOrders: (status?: string, page = 0, size = 10) =>
    api.get<ApiResponse<Order[]>>(`/orders?${status ? `status=${status}&` : ''}page=${page}&size=${size}`),

  getDetail: (id: number) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`),

  cancel: (id: number, reason?: string) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/cancel${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`),
}
