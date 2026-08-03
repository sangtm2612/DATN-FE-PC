import api from '@/lib/axios'
import type { ApiResponse, Tag } from '@/types'

export const tagService = {
  search: (search = '') =>
    api.get<ApiResponse<Tag[]>>(`/tags${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  create: (name: string) =>
    api.post<ApiResponse<Tag>>('/tags', { name }),
}
