import ProductCard from './ProductCard'
import type { Product } from '@/types'

interface Props {
  products: Product[]
  loading?: boolean
  cols?: 2 | 3 | 4 | 5
}

const colsClass = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
}

export default function ProductGrid({ products, loading, cols = 4 }: Props) {
  if (loading) {
    return (
      <div className={`grid ${colsClass[cols]} gap-4`}>
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton aspect-square" />
            <div className="p-3 space-y-2">
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-4 rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-5 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">Không tìm thấy sản phẩm nào</p>
      </div>
    )
  }

  return (
    <div className={`grid ${colsClass[cols]} gap-4`}>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
