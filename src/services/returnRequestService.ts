import api from '@/lib/axios'
import type { ApiResponse, ReturnRequest } from '@/types'

export interface CreateReturnRequestPayload {
  items: { orderItemId: number; quantity: number }[]
  reasonType: string
  reasonDetail?: string
  mediaUrls?: string[]
}

export interface ReturnRequestDecisionPayload {
  decision: 'approved' | 'rejected'
  resolution?: 'exchange' | 'refund'
  refundAmount?: number
  staffNote?: string
}

export const returnRequestService = {
  create: (orderId: number, data: CreateReturnRequestPayload) =>
    api.post<ApiResponse<ReturnRequest>>(`/orders/${orderId}/return-requests`, data),

  getMy: () =>
    api.get<ApiResponse<ReturnRequest[]>>('/return-requests/my'),

  getAdminAll: (status?: string) =>
    api.get<ApiResponse<ReturnRequest[]>>(`/return-requests/admin${status ? `?status=${status}` : ''}`),

  review: (id: number, staffNote?: string) =>
    api.put<ApiResponse<ReturnRequest>>(`/return-requests/${id}/review`, { staffNote }),

  decide: (id: number, data: ReturnRequestDecisionPayload) =>
    api.put<ApiResponse<ReturnRequest>>(`/return-requests/${id}/decide`, data),

  complete: (id: number) =>
    api.put<ApiResponse<ReturnRequest>>(`/return-requests/${id}/complete`),
}
