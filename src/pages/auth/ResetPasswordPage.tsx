import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const reset = useMutation({
    mutationFn: () => authService.resetPassword(token, password),
    onSuccess: () => { toast.success('Đặt lại mật khẩu thành công!'); navigate('/login') },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Mật khẩu xác nhận không khớp'); return }
    reset.mutate()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Đặt lại mật khẩu</h1>
      <p className="text-gray-500 mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="input" placeholder="Tối thiểu 8 ký tự, có chữ hoa và số" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            className="input" placeholder="Nhập lại mật khẩu mới" required />
        </div>
        <button type="submit" disabled={reset.isPending} className="btn-primary w-full py-3">
          {reset.isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </div>
  )
}
