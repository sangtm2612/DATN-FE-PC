import api from '@/lib/axios'
import type { ApiResponse, PcBuild } from '@/types'

export interface CompatibilityCheckResult {
  isCompatible: boolean
  issues: string[]
}

export interface SaveBuildItemPayload {
  componentTypeId: number
  productId: number
  quantity?: number
}

export interface SaveBuildPayload {
  name?: string
  description?: string
  items: SaveBuildItemPayload[]
}

export const buildPcService = {
  checkCompatibility: (productIds: number[]) =>
    api.post<ApiResponse<CompatibilityCheckResult>>('/build-pc/check-compatibility', { productIds }),

  saveBuild: (data: SaveBuildPayload) =>
    api.post<ApiResponse<PcBuild>>('/build-pc/builds', data),

  getMyBuilds: () =>
    api.get<ApiResponse<PcBuild[]>>('/build-pc/builds'),

  getBuildDetail: (id: number) =>
    api.get<ApiResponse<PcBuild>>(`/build-pc/builds/${id}`),

  deleteBuild: (id: number) =>
    api.delete<ApiResponse<void>>(`/build-pc/builds/${id}`),
}
