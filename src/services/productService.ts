import api from '@/lib/axios'
import type { Product, ApiResponse } from '@/types'

export interface ProductFilter {
  categoryId?: number
  brandId?: number
  minPrice?: number
  maxPrice?: number
  sort?: string
  page?: number
  size?: number
  [key: string]: unknown   // index signature for buildQuery
}

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  })
  return q.toString()
}

export const productService = {
  getList: (filter: ProductFilter) =>
    api.get<ApiResponse<Product[]>>(`/products?${buildQuery(filter)}`),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<Product>>(`/products/${slug}`),

  search: (keyword: string, page = 0, size = 24) =>
    api.get<ApiResponse<Product[]>>(
      `/products/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`
    ),

  getRelated: (id: number, limit = 8) =>
    api.get<ApiResponse<Product[]>>(`/products/${id}/related?limit=${limit}`),

  getHomeData: () =>
    api.get<ApiResponse<{
      sliders: any[]
      categories: any[]
      featuredProducts: Product[]
      newProducts: Product[]
      bestSellers: Product[]
      onSaleProducts: Product[]
    }>>('/home'),
}
