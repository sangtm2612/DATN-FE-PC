import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Store } from '@/types'
import { Package, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface StockRow {
  product: { id: number; name: string; sku?: string; thumbnail?: string }
  store: { id: number }
  stockQty: number
}

export default function AdminStoreStockPage() {
  const [storeId, setStoreId] = useState<number | null>(null)
  const [newProductId, setNewProductId] = useState('')
  const [newQty, setNewQty] = useState('')
  const qc = useQueryClient()

  const { data: stores } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: () => api.get<{ data: Store[] }>('/stores').then(r => {
      const list = r.data.data || []
      if (list.length && storeId === null) setStoreId(list[0].id)
      return list
    }),
  })

  const { data: stock, isLoading } = useQuery({
    queryKey: ['store-stock', storeId],
    queryFn: () => api.get<{ data: StockRow[] }>(`/stores/${storeId}/stock`).then(r => r.data.data || []),
    enabled: storeId !== null,
  })

  const updateStock = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.put(`/stores/${storeId}/stock/${productId}?quantity=${quantity}`),
    onSuccess: () => {
      toast.success('Đã cập nhật tồn kho')
      qc.invalidateQueries({ queryKey: ['store-stock', storeId] })
    },
  })

  const addProduct = () => {
    const productId = +newProductId
    const quantity = +newQty
    if (!productId || quantity < 0) { toast.error('Nhập ID sản phẩm và số lượng hợp lệ'); return }
    updateStock.mutate({ productId, quantity }, {
      onSuccess: () => { setNewProductId(''); setNewQty('') },
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tồn kho theo showroom</h1>
        <select value={storeId ?? ''} onChange={e => setStoreId(+e.target.value)} className="input w-64">
          {stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="card p-5 mb-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus size={16} /> Thêm/cập nhật tồn kho sản phẩm</h3>
        <div className="flex gap-2">
          <input value={newProductId} onChange={e => setNewProductId(e.target.value)}
            placeholder="ID sản phẩm" className="input w-40" type="number" />
          <input value={newQty} onChange={e => setNewQty(e.target.value)}
            placeholder="Số lượng" className="input w-32" type="number" />
          <button onClick={addProduct} disabled={updateStock.isPending} className="btn-primary px-4">
            Lưu
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Sản phẩm', 'SKU', 'Tồn kho', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Đang tải...</td></tr>
            ) : !stock?.length ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">
                <Package size={32} className="mx-auto mb-2 opacity-30" /> Chưa có sản phẩm nào trong showroom này
              </td></tr>
            ) : stock.map(row => (
              <StockRowItem key={row.product.id} row={row}
                onSave={qty => updateStock.mutate({ productId: row.product.id, quantity: qty })}
                saving={updateStock.isPending} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StockRowItem({ row, onSave, saving }: { row: StockRow; onSave: (qty: number) => void; saving: boolean }) {
  const [qty, setQty] = useState(row.stockQty)
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{row.product.name}</td>
      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.product.sku}</td>
      <td className="px-4 py-3">
        <input type="number" value={qty} onChange={e => setQty(Math.max(0, +e.target.value))}
          className="input w-24 py-1" />
      </td>
      <td className="px-4 py-3">
        <button onClick={() => onSave(qty)} disabled={saving || qty === row.stockQty}
          className="text-xs text-primary-500 hover:underline disabled:text-gray-300">
          Lưu
        </button>
      </td>
    </tr>
  )
}
