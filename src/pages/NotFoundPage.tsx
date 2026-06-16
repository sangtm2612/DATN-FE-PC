import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container py-24 text-center">
      <p className="text-8xl font-black text-primary-500 mb-4">404</p>
      <h1 className="text-2xl font-bold mb-2">Trang không tồn tại</h1>
      <p className="text-gray-500 mb-8">Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      <Link to="/" className="btn-primary px-8 py-3">Về trang chủ</Link>
    </div>
  )
}
