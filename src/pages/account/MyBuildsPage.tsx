import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { buildPcService } from '@/services/buildPcService'
import { cartService } from '@/services/cartService'
import { useCartStore } from '@/store/cartStore'
import { formatPrice, formatDate } from '@/lib/utils'
import { Cpu, Eye, ShoppingCart, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MyBuildsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { setCart } = useCartStore()

  const { data: builds, isLoading } = useQuery({
    queryKey: ['my-pc-builds'],
    queryFn: () => buildPcService.getMyBuilds().then(r => r.data.data || []),
  })

  const deleteBuild = useMutation({
    mutationFn: (id: number) => buildPcService.deleteBuild(id),
    onSuccess: () => {
      toast.success('Đã xóa cấu hình')
      qc.invalidateQueries({ queryKey: ['my-pc-builds'] })
    },
  })

  const orderFromBuild = useMutation({
    mutationFn: async (buildId: number) => {
      const build = builds?.find(b => b.id === buildId)
      if (!build) return
      // Giỏ hàng chỉ chứa đúng linh kiện của cấu hình này khi đặt hàng
      await cartService.clearCart()
      for (const item of build.items) {
        await cartService.addItem(item.productId, item.quantity)
      }
      return cartService.getCart()
    },
    onSuccess: (res, buildId) => {
      if (res?.data.data) setCart(res.data.data)
      navigate(`/checkout?buildId=${buildId}`)
    },
  })

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Cpu size={20} className="text-primary-500" /> Cấu hình đã lưu
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : !builds?.length ? (
        <div className="text-center py-12 text-gray-400">
          <Cpu size={40} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có cấu hình PC nào được lưu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {builds.map(build => (
            <div key={build.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-800">{build.name}</p>
                <span className="text-xs text-gray-400">{formatDate(build.createdAt, 'DD/MM/YYYY')}</span>
              </div>

              <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                {build.items.map(item => (
                  <img key={item.id} src={item.productThumbnail || '/placeholder.png'}
                    alt={item.productName} title={item.productName}
                    className="w-12 h-12 object-contain bg-gray-50 rounded-lg border flex-shrink-0" />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-primary-500">{formatPrice(build.totalPrice)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteBuild.mutate(build.id)}
                    disabled={deleteBuild.isPending}
                    className="text-xs text-red-500 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Xóa
                  </button>
                  <button
                    onClick={() => navigate(`/build-pc?buildId=${build.id}`)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Eye size={12} /> Xem lại
                  </button>
                  <button
                    onClick={() => orderFromBuild.mutate(build.id)}
                    disabled={orderFromBuild.isPending}
                    className="text-xs bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <ShoppingCart size={12} /> Đặt hàng
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
