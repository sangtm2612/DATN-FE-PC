import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'
import { Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const forgot = useMutation({
    mutationFn: () => authService.forgotPassword(email),
    onSuccess: () => { setSent(true); toast.success('Email đã được gửi!') },
  })

  if (sent) return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail size={28} className="text-green-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">Kiểm tra email</h2>
      <p className="text-gray-500 text-sm mb-6">Chúng tôi đã gửi link đặt lại mật khẩu đến <strong>{email}</strong>. Link có hiệu lực trong 15 phút.</p>
      <Link to="/login" className="text-primary-500 text-sm hover:underline">← Quay lại đăng nhập</Link>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Quên mật khẩu?</h1>
      <p className="text-gray-500 mb-6">Nhập email của bạn để nhận link đặt lại mật khẩu.</p>
      <form onSubmit={e => { e.preventDefault(); forgot.mutate() }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="input" placeholder="example@email.com" required autoFocus />
        </div>
        <button type="submit" disabled={forgot.isPending} className="btn-primary w-full py-3">
          {forgot.isPending ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-primary-500 hover:underline">← Quay lại đăng nhập</Link>
      </p>
    </div>
  )
}
