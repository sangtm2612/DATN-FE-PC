import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Facebook, Youtube, Send } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Footer() {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) { toast.success('Đăng ký nhận tin thành công!'); setEmail('') }
  }

  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      {/* Main footer */}
      <div className="container py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">K</span>
            </div>
            <span className="text-white font-bold text-xl">KinhDuanPC</span>
          </Link>
          <p className="text-sm leading-relaxed mb-4">
            Website bán máy tính trực tuyến uy tín — Laptop, PC Gaming, linh kiện chính hãng, bảo hành minh bạch.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-primary-400 flex-shrink-0" />
              <a href="tel:19001903" className="hover:text-white">1900 1903</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-primary-400 flex-shrink-0" />
              <a href="mailto:support@kinhduanpc.vn" className="hover:text-white">support@kinhduanpc.vn</a>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-primary-400 flex-shrink-0 mt-0.5" />
              <span>Hệ thống 21 cửa hàng toàn quốc</span>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-white font-semibold mb-4">Sản phẩm</h4>
          <ul className="space-y-2 text-sm">
            {['Laptop Gaming', 'PC Gaming', 'Laptop Văn phòng', 'Linh kiện máy tính',
              'Màn hình', 'Bàn phím & Chuột', 'Tai nghe', 'Camera an ninh'].map(item => (
              <li key={item}>
                <Link to="/products" className="hover:text-white hover:underline transition-colors">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm">
            {[
              { to: '/tra-don-hang', label: 'Tra cứu đơn hàng' },
              { to: '/tra-bao-hanh', label: 'Tra cứu bảo hành' },
              { to: '/build-pc',     label: 'Build PC' },
              { to: '/cua-hang',     label: 'Hệ thống cửa hàng' },
              { to: '/tin-tuc',      label: 'Tin tức & Blog' },
              { to: '/register',     label: 'Đăng ký tài khoản' },
            ].map(item => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-white hover:underline transition-colors">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-white font-semibold mb-4">Nhận tin khuyến mãi</h4>
          <p className="text-sm mb-4">Đăng ký để nhận ưu đãi độc quyền và thông tin sản phẩm mới nhất.</p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email của bạn"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
            <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg transition-colors">
              <Send size={16} />
            </button>
          </form>

          <div className="mt-6">
            <p className="text-sm font-medium text-white mb-3">Phương thức thanh toán</p>
            <div className="flex flex-wrap gap-2">
              {['COD', 'VNPay', 'MoMo', 'ZaloPay', 'Trả góp'].map(m => (
                <span key={m} className="bg-gray-800 border border-gray-700 text-xs px-2 py-1 rounded">{m}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <a href="#" className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors">
              <Facebook size={16} className="text-white" />
            </a>
            <a href="#" className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
              <Youtube size={16} className="text-white" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© 2026 KinhDuanPC. Luận án tốt nghiệp — Website bán máy tính trực tuyến.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
