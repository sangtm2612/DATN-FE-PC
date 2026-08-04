import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatPrice } from '@/lib/utils'
import { cartService } from '@/services/cartService'
import { buildPcService } from '@/services/buildPcService'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import type { Product } from '@/types'
import toast from 'react-hot-toast'
import { Plus, X, ShoppingCart, Save, Printer, AlertTriangle, CheckCircle2, Cpu } from 'lucide-react'

interface ComponentType {
  id: number
  name: string
  slug: string
  categoryId?: number   // ID danh mục linh kiện tương ứng
  isRequired: boolean
  sortOrder: number
}

interface SelectedComponent {
  typeId: number
  typeName: string
  product: Product
}

const COMPONENT_ICONS: Record<string, string> = {
  cpu: '🔲', mainboard: '🟦', ram: '💾', ssd: '💿', hdd: '🗂️',
  vga: '🎮', psu: '⚡', case: '📦', monitor: '🖥️', keyboard: '⌨️',
  mouse: '🖱️', headphone: '🎧', speaker: '🔊', cooling: '❄️',
}

export default function BuildPCPage() {
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([])
  const [selectingType, setSelectingType] = useState<ComponentType | null>(null)
  const [buildName, setBuildName] = useState('Cấu hình PC của tôi')
  const { setCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loadBuildId = searchParams.get('buildId')

  const { data: componentTypes } = useQuery({
    queryKey: ['pc-component-types'],
    queryFn: () => api.get<{ data: ComponentType[] }>('/build-pc/component-types').then(r => r.data.data || []),
  })

  // Nạp lại cấu hình đã lưu khi có ?buildId=
  const { data: loadedBuild } = useQuery({
    queryKey: ['pc-build-detail', loadBuildId],
    queryFn: () => buildPcService.getBuildDetail(Number(loadBuildId)).then(r => r.data.data),
    enabled: !!loadBuildId,
  })

  useEffect(() => {
    if (!loadedBuild) return
    setBuildName(loadedBuild.name)
    setSelectedComponents(loadedBuild.items.map(item => ({
      typeId: item.componentTypeId,
      typeName: item.componentTypeName,
      product: {
        id: item.productId,
        name: item.productName,
        thumbnail: item.productThumbnail,
        price: item.unitPrice,
      } as Product,
    })))
  }, [loadedBuild])

  const productIds = selectedComponents.map(c => c.product.id).sort((a, b) => a - b)
  const { data: compatibility } = useQuery({
    queryKey: ['pc-compatibility', productIds.join(',')],
    queryFn: () => buildPcService.checkCompatibility(productIds).then(r => r.data.data),
    enabled: productIds.length > 0,
  })

  const { data: productsForType } = useQuery({
    queryKey: ['pc-products-for-type', selectingType?.id],
    queryFn: () => {
      // Ưu tiên dùng categoryId nếu có, fallback sang search theo tên loại linh kiện
      const params = selectingType?.categoryId
        ? `/products?categoryId=${selectingType.categoryId}&size=50`
        : `/products/search?keyword=${encodeURIComponent(selectingType!.name)}&size=50`
      return api.get<{ data: Product[] }>(params).then(r => r.data.data || [])
    },
    enabled: !!selectingType,
  })

  const totalPrice = selectedComponents.reduce((sum, c) => sum + c.product.price, 0)

  const selectComponent = (type: ComponentType, product: Product) => {
    setSelectedComponents(prev => {
      const filtered = prev.filter(c => c.typeId !== type.id)
      return [...filtered, { typeId: type.id, typeName: type.name, product }]
    })
    setSelectingType(null)
    toast.success(`Đã chọn ${type.name}`)
  }

  const removeComponent = (typeId: number) => {
    setSelectedComponents(prev => prev.filter(c => c.typeId !== typeId))
  }

  const addAllToCart = useMutation({
    mutationFn: async () => {
      for (const comp of selectedComponents) {
        await cartService.addItem(comp.product.id, 1)
      }
      return cartService.getCart()
    },
    onSuccess: (res) => {
      if (res.data.data) setCart(res.data.data)
      toast.success('Đã thêm tất cả vào giỏ hàng')
    },
  })

  const saveBuild = useMutation({
    mutationFn: () => buildPcService.saveBuild({
      name: buildName,
      items: selectedComponents.map(c => ({ componentTypeId: c.typeId, productId: c.product.id, quantity: 1 })),
    }),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình')
      navigate('/account/builds')
    },
    onError: () => toast.error('Lưu cấu hình thất bại, vui lòng thử lại'),
  })

  const handleSaveBuild = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu cấu hình')
      navigate('/login')
      return
    }
    saveBuild.mutate()
  }

  const requiredTypes = componentTypes?.filter(t => t.isRequired) || []
  const missingRequired = requiredTypes.filter(t => !selectedComponents.find(c => c.typeId === t.id))

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="text-primary-500" size={24} /> Build PC
          </h1>
          <p className="text-gray-500 text-sm mt-1">Tự chọn linh kiện — Kiểm tra tương thích — Giảm giá tới 50% CPU</p>
        </div>
        <input
          value={buildName}
          onChange={e => setBuildName(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm hidden md:block focus:outline-none focus:border-primary-500"
          placeholder="Tên cấu hình"
        />
      </div>

      {/* Promo banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 mb-6 text-gray-900">
        <p className="font-bold">🎉 Ưu đãi Build PC:</p>
        <p className="text-sm mt-1">Giảm <strong>30%</strong> CPU khi chọn đủ Main + RAM + SSD + Nguồn + Case</p>
        <p className="text-sm">Giảm <strong>50%</strong> CPU khi chọn thêm VGA từ RX6500XT/RTX3050 trở lên</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component selector */}
        <div className="lg:col-span-2">
          <div className="space-y-2">
            {componentTypes?.map(type => {
              const selected = selectedComponents.find(c => c.typeId === type.id)
              return (
                <div key={type.id}
                  className={`card p-4 flex items-center gap-4 transition-shadow hover:shadow-md
                    ${type.isRequired && !selected ? 'border-l-4 border-l-orange-400' : ''}`}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    {COMPONENT_ICONS[type.slug] || '🔧'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-gray-700">{type.name}</span>
                      {type.isRequired && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">BẮT BUỘC</span>
                      )}
                    </div>

                    {selected ? (
                      <div className="flex items-center gap-2">
                        <img src={selected.product.thumbnail || '/placeholder.png'}
                          alt="" className="w-8 h-8 object-contain bg-white rounded border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selected.product.name}</p>
                          <p className="text-xs text-primary-500 font-semibold">{formatPrice(selected.product.price)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Chưa chọn {type.name}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selected && (
                      <button onClick={() => removeComponent(type.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectingType(type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${selected
                          ? 'text-gray-600 border hover:border-primary-500 hover:text-primary-500'
                          : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                    >
                      <Plus size={14} />
                      {selected ? 'Đổi' : 'Chọn'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Tổng cấu hình</h3>

            {selectedComponents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Cpu size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa chọn linh kiện nào</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {selectedComponents.map(comp => (
                  <div key={comp.typeId} className="flex justify-between items-center gap-2 text-sm py-1.5 border-b last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{comp.typeName}</p>
                      <p className="font-medium truncate max-w-32">{comp.product.name}</p>
                    </div>
                    <span className="font-semibold text-primary-500 flex-shrink-0">{formatPrice(comp.product.price)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {missingRequired.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-600">
                  Còn thiếu: {missingRequired.map(t => t.name).join(', ')}
                </p>
              </div>
            )}

            {/* Compatibility check (BE) */}
            {compatibility && compatibility.issues.length > 0 && (
              <div className={`border rounded-lg p-3 mb-4 flex items-start gap-2
                ${compatibility.isCompatible ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${compatibility.isCompatible ? 'text-amber-500' : 'text-red-500'}`} />
                <ul className={`text-xs space-y-1 ${compatibility.isCompatible ? 'text-amber-700' : 'text-red-600'}`}>
                  {compatibility.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              </div>
            )}
            {compatibility && compatibility.issues.length === 0 && selectedComponents.length > 1 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-600">Các linh kiện tương thích với nhau</p>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Tổng cộng:</span>
                <span className="text-xl font-bold text-primary-500">{formatPrice(totalPrice)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {selectedComponents.length} / {componentTypes?.length || 0} linh kiện
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => addAllToCart.mutate()}
                disabled={selectedComponents.length === 0 || addAllToCart.isPending || compatibility?.isCompatible === false}
                title={compatibility?.isCompatible === false ? 'Linh kiện chưa tương thích, vui lòng kiểm tra lại' : undefined}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} />
                {addAllToCart.isPending ? 'Đang thêm...' : 'Thêm tất cả vào giỏ'}
              </button>
              <button
                onClick={handleSaveBuild}
                disabled={selectedComponents.length === 0 || saveBuild.isPending || compatibility?.isCompatible === false}
                title={compatibility?.isCompatible === false ? 'Linh kiện chưa tương thích, vui lòng kiểm tra lại' : undefined}
                className="btn-outline w-full py-2.5 flex items-center justify-center gap-2"
              >
                <Save size={16} /> {saveBuild.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
              <button onClick={() => window.print()}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2">
                <Printer size={14} /> In cấu hình
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product selection modal */}
      {selectingType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">Chọn {selectingType.name}</h3>
              <button onClick={() => setSelectingType(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {!productsForType?.length ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Đang tải sản phẩm...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {productsForType.map(product => (
                    <button key={product.id}
                      onClick={() => selectComponent(selectingType, product)}
                      className="w-full flex items-center gap-4 p-3 border rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                    >
                      <img src={product.thumbnail || '/placeholder.png'}
                        alt={product.name} className="w-14 h-14 object-contain bg-gray-50 rounded-lg border flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm line-clamp-2">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {product.stockQty > 0 ? `Còn ${product.stockQty}` : <span className="text-red-500">Hết hàng</span>}
                          {product.warrantyMonths > 0 && ` • BH ${product.warrantyMonths}T`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary-500">{formatPrice(product.price)}</p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
