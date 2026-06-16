import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { productService } from '@/services/productService'
import ProductGrid from '@/components/product/ProductGrid'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { ChevronRight, Cpu, Truck, Shield, Headphones, RotateCcw } from 'lucide-react'

const POLICIES = [
  { icon: Truck,       title: 'Miễn phí vận chuyển', desc: 'Đơn từ 5 triệu đồng' },
  { icon: Shield,      title: 'Bảo hành chính hãng', desc: 'Tới 36 tháng' },
  { icon: RotateCcw,   title: 'Đổi trả 15 ngày',     desc: 'Không cần lý do' },
  { icon: Headphones,  title: 'Hỗ trợ 24/7',          desc: 'Hotline 1900 1903' },
]

export default function HomePage() {
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: () => productService.getHomeData().then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div>
      {/* Hero Slider */}
      <section className="bg-gray-100">
        {homeData?.sliders && homeData.sliders.length > 0 ? (
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 4000 }}
            pagination={{ clickable: true }}
            navigation
            loop
            className="w-full"
          >
            {homeData.sliders.map((banner: any) => (
              <SwiperSlide key={banner.id}>
                <a href={banner.linkUrl || '#'}>
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-[300px] md:h-[420px] lg:h-[500px] object-cover" />
                </a>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="h-[300px] md:h-[420px] bg-gradient-to-r from-primary-600 to-primary-800 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">KinhDuanPC</h1>
              <p className="text-lg md:text-xl mb-6 text-primary-100">Máy tính chính hãng — Giá tốt nhất thị trường</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link to="/products" className="bg-white text-primary-600 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors">
                  Mua ngay
                </Link>
                <Link to="/build-pc" className="bg-yellow-400 text-gray-800 font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 transition-colors">
                  <Cpu className="inline mr-2" size={16} />Build PC
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Policies */}
      <section className="bg-white border-b">
        <div className="container py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {POLICIES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {homeData?.categories && homeData.categories.length > 0 && (
        <section className="container py-8">
          <h2 className="section-title">Danh mục sản phẩm</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {homeData.categories.map((cat: any) => (
              <Link key={cat.id} to={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-primary-50 hover:text-primary-500 transition-colors group text-center">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-contain" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-full group-hover:bg-primary-100" />
                )}
                <span className="text-xs font-medium text-gray-700 group-hover:text-primary-500 leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">Sản phẩm nổi bật</h2>
          <Link to="/products?sort=featured" className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:underline">
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>
        <ProductGrid products={homeData?.featuredProducts || []} loading={isLoading} />
      </section>

      {/* Best sellers */}
      <section className="bg-gray-50 py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">Bán chạy nhất</h2>
            <Link to="/products?sort=best-seller" className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:underline">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>
          <ProductGrid products={homeData?.bestSellers || []} loading={isLoading} />
        </div>
      </section>

      {/* New products */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">Hàng mới về</h2>
          <Link to="/products?sort=newest" className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:underline">
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>
        <ProductGrid products={homeData?.newProducts || []} loading={isLoading} />
      </section>

      {/* Sale */}
      {homeData?.onSaleProducts && homeData.onSaleProducts.length > 0 && (
        <section className="bg-primary-50 py-8">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title mb-0 text-primary-600">🔥 Đang giảm giá</h2>
              <Link to="/products?sale=true" className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:underline">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
            <ProductGrid products={homeData.onSaleProducts} />
          </div>
        </section>
      )}

      {/* Build PC Banner */}
      <section className="container py-8">
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Build PC theo yêu cầu</h2>
            <p className="text-gray-300 text-base">Tự chọn linh kiện, kiểm tra tương thích, giảm giá tới 50% CPU khi lắp đủ bộ</p>
          </div>
          <Link to="/build-pc" className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-xl transition-colors flex items-center gap-2">
            <Cpu size={20} /> Bắt đầu Build PC
          </Link>
        </div>
      </section>
    </div>
  )
}
