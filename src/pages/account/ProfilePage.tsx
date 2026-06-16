import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const { register, handleSubmit } = useForm({ defaultValues: { fullName: user?.fullName, phone: user?.phone } })

  const update = useMutation({
    mutationFn: (data: any) => api.put('/users/profile', data),
    onSuccess: (_, data) => { updateUser(data); toast.success('Cập nhật thành công') },
  })

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Thông tin tài khoản</h2>
      <form onSubmit={handleSubmit(d => update.mutate(d))} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
          <input {...register('fullName')} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={user?.email || ''} className="input bg-gray-50" disabled />
          <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
          <input {...register('phone')} className="input" />
        </div>
        <button type="submit" disabled={update.isPending} className="btn-primary px-6 py-2.5">
          {update.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  )
}
