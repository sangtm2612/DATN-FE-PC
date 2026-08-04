import api from '@/lib/axios'
import type { ApiResponse, ServiceRequest } from '@/types'

export interface CreateServiceRequestPayload {
  warrantyId?: number
  productName?: string
  serialNumber?: string
  issueDesc: string
  mediaUrls?: string[]
}

export interface UpdateServiceRequestStatusPayload {
  status: string
  diagnosis?: string
  repairCost?: number
  technicianId?: number
}

export const serviceRequestService = {
  create: (data: CreateServiceRequestPayload) =>
    api.post<ApiResponse<ServiceRequest>>('/warranties/service-requests', data),

  getMy: () =>
    api.get<ApiResponse<ServiceRequest[]>>('/warranties/service-requests/my'),

  getAdminAll: (status?: string, storeId?: number) =>
    api.get<ApiResponse<ServiceRequest[]>>(
      `/warranties/service-requests/admin?${status ? `status=${status}&` : ''}${storeId ? `storeId=${storeId}` : ''}`
    ),

  getTechnicians: () =>
    api.get<ApiResponse<{ id: number; fullName: string }[]>>('/warranties/service-requests/technicians'),

  updateStatus: (id: number, data: UpdateServiceRequestStatusPayload) =>
    api.put<ApiResponse<ServiceRequest>>(`/warranties/service-requests/${id}/status`, data),

  approveRepair: (id: number, approved: boolean) =>
    api.put<ApiResponse<ServiceRequest>>(`/warranties/service-requests/${id}/approve-repair?approved=${approved}`),
}
