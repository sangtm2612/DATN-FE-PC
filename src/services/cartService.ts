import api from '@/lib/axios'
import type { Cart, ApiResponse } from '@/types'

export const cartService = {
  getCart: () =>
    api.get<ApiResponse<Cart>>('/cart'),

  addItem: (productId: number, quantity = 1) =>
    api.post<ApiResponse<Cart>>(`/cart/items?productId=${productId}&quantity=${quantity}`),

  updateItem: (productId: number, quantity: number) =>
    api.put<ApiResponse<Cart>>(`/cart/items/${productId}?quantity=${quantity}`),

  removeItem: (productId: number) =>
    api.delete<ApiResponse<Cart>>(`/cart/items/${productId}`),

  clearCart: () =>
    api.delete<ApiResponse<Cart>>('/cart'),

  mergeCart: (sessionId: string) =>
    api.post('/cart/merge', null, { headers: { 'X-Session-Id': sessionId } }),
}
