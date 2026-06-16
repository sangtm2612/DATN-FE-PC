import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, ShoppingCart, Heart, User, Phone, Cpu,
  ClipboardList, Shield, ChevronDown, Menu, X, Bell
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/productService'
import api from '@/lib/axios'
import type { Category } from '@/types'
import toast from 'react-hot-toast'

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const { cart, setOpen } = useCartStore()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: categories } = useQuery({
    queryKey: ['root-categories'],
    queryFn: () => api.get<{ data: Category[] }>('/categories').then(r => r.data.data),
    staleTime: 1000 * 60 * 10,
  })

  const { data: suggestions } = useQuery({
    queryKey: ['search-suggest', searchQuery],
    queryFn: () => productService.search(searchQuery, 0, 6).then(r => r.data.data || []),
    enabled: searchQuery.length >= 2,
    staleTime: 0,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/tim-kiem?q=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    toast.success('Đã đăng xuất')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-primary-600 text-white text-xs">
        <div className="container flex items-center justify-between py-1.5">
          <div className="flex items-center gap-4">
            <a href="tel:19001903" className="flex items-center gap-1 hover:text-primary-200">
              <Phone size={12} /> <span>Hotline: 1900 1903</span>
            </a>
            <Link to="/tra-don-hang" className="flex items-center gap-1 hover:text-primary-200">
              <ClipboardList size={12} /> <span>Tra cứu đơn hàng</span>
            </Link>
            <Link to="/tra-bao-hanh" className="flex items-center gap-1 hover:text-primary-200">
              <Shield size={12} /> <span>Tra cứu bảo hành</span>
            </Link>
          </div>
          <Link to="/build-pc" className="flex items-center gap-1 bg-yellow-400 text-gray-800 px-3 py-0.5 rounded font-semibold hover:bg-yellow-300">
            <Cpu size={12} /> <span>Build PC</span>
          </Link>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex items-center gap-4 py-3">
        {/* Mobile menu btn */}
        <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <div className="hidden sm:block">
            <p className="font-bold text-gray-800 text-lg leading-tight">KinhDuanPC</p>
            <p className="text-xs text-gray-400 leading-tight">Máy tính chính hãng</p>
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Tìm kiếm laptop, PC gaming, linh kiện..."
              className="w-full border-2 border-gray-200 focus:border-primary-500 rounded-xl pl-4 pr-12 py-2.5 text-sm outline-none transition-colors"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center justify-center transition-colors">
              <Search size={16} />
            </button>
          </form>

          {/* Autocomplete */}
          {searchOpen && suggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 z-50 overflow-hidden">
              {suggestions.map(p => (
                <Link
                  key={p.id}
                  to={`/san-pham/${p.slug}`}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <img src={p.thumbnail || '/placeholder.png'} alt={p.name} className="w-10 h-10 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-primary-500 font-semibold">
                      {p.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </Link>
              ))}
              <button
                onClick={handleSearch}
                className="w-full px-4 py-2.5 text-sm text-primary-500 font-medium hover:bg-primary-50 border-t text-left"
              >
                Xem tất cả kết quả cho "{searchQuery}"
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Wishlist */}
          {isAuthenticated && (
            <Link to="/account/wishlist" className="btn-ghost hidden md:flex flex-col items-center gap-0.5 px-2 py-1">
              <Heart size={20} />
              <span className="text-[10px]">Yêu thích</span>
            </Link>
          )}

          {/* Cart */}
          <button onClick={() => setOpen(true)} className="btn-ghost flex flex-col items-center gap-0.5 px-2 py-1 relative">
            <div className="relative">
              <ShoppingCart size={20} />
              {cart.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cart.totalItems > 99 ? '99+' : cart.totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px]">Giỏ hàng</span>
          </button>

          {/* User */}
          <div className="relative">
            {isAuthenticated ? (
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="btn-ghost flex flex-col items-center gap-0.5 px-2 py-1"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                ) : (
                  <User size={20} />
                )}
                <span className="text-[10px] max-w-16 truncate">{user?.fullName?.split(' ').pop()}</span>
              </button>
            ) : (
              <Link to="/login" className="btn-ghost flex flex-col items-center gap-0.5 px-2 py-1">
                <User size={20} />
                <span className="text-[10px]">Đăng nhập</span>
              </Link>
            )}

            {userMenuOpen && isAuthenticated && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <p className="font-semibold text-sm truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                {[
                  { to: '/account/profile',   label: 'Thông tin tài khoản' },
                  { to: '/account/orders',    label: 'Đơn hàng của tôi' },
                  { to: '/account/wishlist',  label: 'Sản phẩm yêu thích' },
                  { to: '/account/warranties',label: 'Bảo hành của tôi' },
                  ...(user?.role === 'admin' || user?.role === 'staff'
                    ? [{ to: '/admin', label: 'Quản trị hệ thống' }] : []),
                ].map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-gray-50 hover:text-primary-500 transition-colors">
                    {item.label}
                  </Link>
                ))}
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t">
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden lg:block border-t bg-white">
        <div className="container flex items-center gap-0 py-0">
          {categories?.slice(0, 10).map(cat => (
            <div key={cat.id} className="group relative">
              <Link
                to={`/category/${cat.slug}`}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary-500 hover:bg-primary-50 transition-colors whitespace-nowrap"
              >
                {cat.iconUrl && <img src={cat.iconUrl} alt="" className="w-4 h-4" />}
                {cat.name}
                {cat.children && cat.children.length > 0 && <ChevronDown size={12} />}
              </Link>
              {/* Mega dropdown */}
              {cat.children && cat.children.length > 0 && (
                <div className="absolute left-0 top-full invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all bg-white border border-gray-200 rounded-xl shadow-xl min-w-48 z-50 py-2">
                  {cat.children.map(child => (
                    <Link key={child.id} to={`/category/${child.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-500 transition-colors">
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white max-h-96 overflow-y-auto">
          {categories?.map(cat => (
            <Link key={cat.id} to={`/category/${cat.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 border-b text-sm hover:bg-gray-50">
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
