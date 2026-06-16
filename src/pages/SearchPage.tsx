import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/productService'
import ProductGrid from '@/components/product/ProductGrid'
import Pagination from '@/components/common/Pagination'
import { useState } from 'react'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('q') || ''
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['search', keyword, page],
    queryFn: () => productService.search(keyword, page, 24).then(r => r.data),
    enabled: keyword.length > 0,
  })

  return (
    <div className="container py-8">
      <h1 className="text-xl font-bold mb-2">
        Kết quả tìm kiếm: "<span className="text-primary-500">{keyword}</span>"
      </h1>
      {data?.pagination && (
        <p className="text-gray-500 text-sm mb-6">Tìm thấy {data.pagination.total} sản phẩm</p>
      )}
      <ProductGrid products={data?.data || []} loading={isLoading} />
      {data?.pagination && (
        <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages}
          onPageChange={p => { setPage(p); setSearchParams({ q: keyword, page: String(p) }) }} />
      )}
    </div>
  )
}
