import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { cartService } from '@/services/cartService'
import { useCartStore } from '@/store/cartStore'
import { getOrCreateSessionId } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const schema = z.object({
  credential: z.string().min(1, 'Email hoặc số điện thoại không được để trống'),
  password:   z.string().min(1, 'Mật khẩu không được để trống'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { setAuth } = useAuthStore()
  const { setCart } = useCartStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPwd, setShowPwd] = useState(false)
  const from = (location.state as any)?.from?.pathname || '/'

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const login = useMutation({
    mutationFn: (data: FormData) => authService.login(data),
    onSuccess: async (res) => {
      const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken)

      // Merge cart
      try {
        const sessionId = getOrCreateSessionId()
        await cartService.mergeCart(sessionId)
        const cartRes = await cartService.getCart()
        if (cartRes.data.data) setCart(cartRes.data.data)
      } catch {}

      toast.success(`Chào mừng, ${user.fullName}!`)
      navigate(from, { replace: true })
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Đăng nhập</h1>
      <p className="text-gray-500 mb-6">Chào mừng bạn quay trở lại!</p>

      <form onSubmit={handleSubmit(d => login.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email hoặc số điện thoại</label>
          <input {...register('credential')} className="input" placeholder="example@email.com" autoFocus />
          {errors.credential && <p className="text-red-500 text-xs mt-1">{errors.credential.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <div className="relative">
            <input {...register('password')} type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded accent-primary-500" />
            <span className="text-gray-600">Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/forgot-password" className="text-primary-500 hover:underline">Quên mật khẩu?</Link>
        </div>

        <button type="submit" disabled={login.isPending} className="btn-primary w-full py-3">
          {login.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary-500 font-medium hover:underline">Đăng ký ngay</Link>
      </div>
    </div>
  )
}
