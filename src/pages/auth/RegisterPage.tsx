import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email:    z.string().email('Email không đúng định dạng'),
  phone:    z.string().regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ (10 số, bắt đầu 0)'),
  password: z.string().regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, 'Tối thiểu 8 ký tự, có chữ hoa và số'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: 'Mật khẩu xác nhận không khớp', path: ['confirm'] })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const reg = useMutation({
    mutationFn: ({ confirm, ...data }: FormData) => authService.register(data),
    onSuccess: () => {
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.')
      navigate('/login')
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký tài khoản</h1>
      <p className="text-gray-500 mb-6">Tạo tài khoản để mua sắm dễ dàng hơn</p>

      <form onSubmit={handleSubmit(d => reg.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
          <input {...register('fullName')} className="input" placeholder="Nguyễn Văn A" autoFocus />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input {...register('email')} type="email" className="input" placeholder="example@email.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
          <input {...register('phone')} className="input" placeholder="0901234567" />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
          <div className="relative">
            <input {...register('password')} type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="Tối thiểu 8 ký tự, có chữ hoa và số" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu *</label>
          <input {...register('confirm')} type="password" className="input" placeholder="Nhập lại mật khẩu" />
          {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
        </div>

        <button type="submit" disabled={reg.isPending} className="btn-primary w-full py-3">
          {reg.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary-500 font-medium hover:underline">Đăng nhập</Link>
      </p>
    </div>
  )
}
