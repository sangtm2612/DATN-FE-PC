import { Outlet, NavLink } from 'react-router-dom'
import { User, MapPin, ShoppingBag, Heart, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/account/profile',    label: 'Thông tin tài khoản', icon: User },
  { to: '/account/addresses',  label: 'Địa chỉ giao hàng',  icon: MapPin },
  { to: '/account/orders',     label: 'Đơn hàng của tôi',   icon: ShoppingBag },
  { to: '/account/wishlist',   label: 'Sản phẩm yêu thích', icon: Heart },
  { to: '/account/warranties', label: 'Bảo hành của tôi',   icon: Shield },
]

export default function AccountPage() {
  const { user } = useAuthStore()

  return (
    <div className="container py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 hidden md:block">
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg">
                {user?.fullName?.[0] ?? 'U'}
              </div>
              <div>
                <p className="font-semibold truncate max-w-36">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate max-w-36">{user?.email}</p>
              </div>
            </div>
          </div>
          <nav className="card overflow-hidden">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b last:border-0
                   ${isActive ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`
                }
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="card p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
