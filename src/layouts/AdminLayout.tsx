import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingCart, Tag, Layers,
  Image, FileText, MapPin, Ticket, Percent, Warehouse, Wrench, Undo2, LogOut, Menu, X,
  ChevronRight, Bell
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/admin',            label: 'Dashboard',    icon: LayoutDashboard, exact: true, roles: ['admin', 'staff'] },
  { to: '/admin/products',   label: 'Sản phẩm',     icon: Package,         roles: ['admin', 'staff'] },
  { to: '/admin/orders',     label: 'Đơn hàng',     icon: ShoppingCart,    roles: ['admin', 'staff'] },
  { to: '/admin/categories', label: 'Danh mục',     icon: Layers,          roles: ['admin', 'staff'] },
  { to: '/admin/brands',     label: 'Thương hiệu',  icon: Tag,             roles: ['admin', 'staff'] },
  { to: '/admin/vouchers',   label: 'Voucher',      icon: Ticket,          roles: ['admin', 'staff'] },
  { to: '/admin/promotions', label: 'Khuyến mãi',   icon: Percent,         roles: ['admin', 'staff'] },
  { to: '/admin/banners',    label: 'Banner',       icon: Image,           roles: ['admin', 'staff'] },
  { to: '/admin/blog',       label: 'Blog',         icon: FileText,        roles: ['admin', 'staff'] },
  { to: '/admin/stores',     label: 'Cửa hàng',     icon: MapPin,          roles: ['admin', 'staff'] },
  { to: '/admin/store-stock', label: 'Tồn kho showroom', icon: Warehouse,  roles: ['admin', 'staff'] },
  { to: '/admin/service-requests', label: 'Yêu cầu sửa chữa', icon: Wrench, roles: ['admin', 'staff', 'technician'] },
  { to: '/admin/return-requests', label: 'Đổi/trả hàng', icon: Undo2, roles: ['admin', 'staff'] },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const visibleNavItems = navItems.filter(item => item.roles.includes(user?.role || ''))

  const handleLogout = () => {
    logout()
    toast.success('Đã đăng xuất')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">K</span>
          </div>
          {sidebarOpen && <span className="font-bold text-lg">KinhDuanPC</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleNavItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors text-sm font-medium
                 ${isActive ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-700 p-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">
                {user?.fullName?.[0] ?? 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-gray-400 hover:text-white">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <button className="relative text-gray-500 hover:text-gray-700">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
            </button>
            <NavLink to="/" className="text-sm text-gray-500 hover:text-primary-500">
              Xem website
            </NavLink>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
