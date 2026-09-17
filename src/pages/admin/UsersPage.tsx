import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import Pagination from '@/components/common/Pagination'
import toast from 'react-hot-toast'
import {
  Search, X, Plus, User, Mail, Phone, ShieldCheck,
  Clock, Package, TrendingUp, UserX, UserCheck, Eye, ChevronDown
} from 'lucide-react'

interface AdminUser {
  id: number
  role: string
  status: string
  email: string
  phone?: string
  fullName?: string
  avatarUrl?: string
  dateOfBirth?: string
  gender?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  lastLoginAt?: string
  createdAt: string
  orderCount?: number
  totalSpent?: number
}

const getUsername = (email?: string) => {
  if (!email) return ''
  const at = email.indexOf('@')
  return at !== -1 ? email.slice(0, at) : email
}

const ROLE_OPTS = [
  { value: '', label: 'Tất cả' },
  { value: 'customer', label: 'Khách hàng' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'technician', label: 'Kỹ thuật viên' },
  { value: 'admin', label: 'Admin' },
]

const ROLE_BADGE: Record<string, string> = {
  customer:   'bg-blue-50 text-blue-700 border-blue-200',
  staff:      'bg-green-50 text-green-700 border-green-200',
  technician: 'bg-orange-50 text-orange-700 border-orange-200',
  admin:      'bg-purple-50 text-purple-700 border-purple-200',
}

const ROLE_LABEL: Record<string, string> = {
  customer: 'Khách hàng', staff: 'Nhân viên',
  technician: 'Kỹ thuật viên', admin: 'Admin',
}

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  banned:   'bg-red-50 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Hoạt động', inactive: 'Không hoạt động', banned: 'Đã khoá',
}

function formatPrice(n?: number) {
  if (!n) return '0 ₫'
  return n.toLocaleString('vi-VN') + ' ₫'
}

function useDebounce(delay: number) {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((fn: () => void) => {
    if (timer) clearTimeout(timer)
    setTimer(setTimeout(fn, delay))
  }, [timer, delay])
}

export default function AdminUsersPage() {
  const [role, setRole] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showCreateStaff, setShowCreateStaff] = useState(false)
  const qc = useQueryClient()
  const debounce = useDebounce(400)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', role, keyword, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (role) params.set('role', role)
      if (keyword) params.set('keyword', keyword)
      params.set('page', String(page))
      params.set('size', '20')
      return api.get<{ data: AdminUser[]; pagination: any }>(`/users/admin/all?${params}`).then(r => r.data)
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/users/admin/${id}/status?status=${status}`),
    onSuccess: () => {
      toast.success('Cập nhật thành công')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setSelectedUser(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Cập nhật thất bại'),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api.patch(`/users/admin/${id}/role?role=${role}`),
    onSuccess: () => {
      toast.success('Đã đổi vai trò')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setSelectedUser(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Đổi vai trò thất bại'),
  })

  const users: AdminUser[] = data?.data || []
  const pagination = data?.pagination

  const handleSearch = (value: string) => {
    setSearchInput(value)
    debounce(() => { setKeyword(value.trim()); setPage(0) })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination?.total != null ? `${pagination.total} tài khoản` : ''}
          </p>
        </div>
        <button onClick={() => setShowCreateStaff(true)}
          className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm nhân viên
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary-500"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setKeyword(''); setPage(0) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(0) }}
          className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 min-w-[160px]">
          {ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Người dùng', 'Liên hệ', 'Vai trò', 'Trạng thái', 'Đăng nhập cuối', 'Ngày tạo', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(u)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                        {u.fullName?.[0]?.toUpperCase() ?? u.email?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {u.fullName || '(Chưa cập nhật)'}
                        <span className="text-gray-400 font-normal"> - {getUsername(u.email)}</span>
                      </p>
                      <p className="text-xs text-gray-400">#{u.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">{u.email}</p>
                  {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_BADGE[u.role] ?? ''}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[u.status] ?? ''}`}>
                    {STATUS_LABEL[u.status] ?? u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt, 'DD/MM/YYYY HH:mm') : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(u.createdAt, 'DD/MM/YYYY')}
                </td>
                <td className="px-4 py-3">
                  <button onClick={e => { e.stopPropagation(); setSelectedUser(u) }}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-primary-500">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && <div className="text-center py-12 text-gray-400">Đang tải...</div>}
        {!isLoading && users.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {keyword ? `Không tìm thấy tài khoản cho "${keyword}"` : 'Không có tài khoản'}
          </div>
        )}
      </div>

      {pagination && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
      )}

      {/* User Detail Panel */}
      {selectedUser && (
        <UserDetailModal
          userId={selectedUser.id}
          initialUser={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateStatus={(status) => updateStatus.mutate({ id: selectedUser.id, status })}
          onUpdateRole={(role) => updateRole.mutate({ id: selectedUser.id, role })}
          isUpdating={updateStatus.isPending || updateRole.isPending}
        />
      )}

      {/* Create Staff Modal */}
      {showCreateStaff && (
        <CreateStaffModal
          onClose={() => setShowCreateStaff(false)}
          onSuccess={() => { setShowCreateStaff(false); qc.invalidateQueries({ queryKey: ['admin-users'] }) }}
        />
      )}
    </div>
  )
}

function UserDetailModal({ userId, initialUser, onClose, onUpdateStatus, onUpdateRole, isUpdating }: {
  userId: number
  initialUser: AdminUser
  onClose: () => void
  onUpdateStatus: (status: string) => void
  onUpdateRole: (role: string) => void
  isUpdating: boolean
}) {
  const { data } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => api.get<{ data: AdminUser }>(`/users/admin/${userId}`).then(r => r.data.data),
    initialData: initialUser,
  })

  const user = data as AdminUser
  const isStaff = ['staff', 'technician', 'admin'].includes(user.role)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-lg">Chi tiết tài khoản</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl">
                {user.fullName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="font-bold text-lg">
                {user.fullName || '(Chưa cập nhật)'}
                <span className="text-base font-normal text-gray-400"> - {getUsername(user.email)}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ROLE_BADGE[user.role] ?? ''}`}>
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[user.status] ?? ''}`}>
                  {STATUS_LABEL[user.status] ?? user.status}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{user.email}</span>
              {user.emailVerified && <span title="Đã xác thực"><ShieldCheck size={13} className="text-green-500" /></span>}
            </div>
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                <span className="text-gray-500">SĐT:</span>
                <span className="font-medium">{user.phone}</span>
                {user.phoneVerified && <ShieldCheck size={13} className="text-green-500" />}
              </div>
            )}
            {user.gender && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="text-gray-500">Giới tính:</span>
                <span className="font-medium capitalize">{user.gender}</span>
              </div>
            )}
            {user.dateOfBirth && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-gray-500">Sinh nhật:</span>
                <span className="font-medium">{formatDate(user.dateOfBirth, 'DD/MM/YYYY')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-500">Tạo lúc:</span>
              <span className="font-medium">{formatDate(user.createdAt, 'DD/MM/YYYY HH:mm')}</span>
            </div>
            {user.lastLoginAt && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-gray-500">Đăng nhập cuối:</span>
                <span className="font-medium">{formatDate(user.lastLoginAt, 'DD/MM/YYYY HH:mm')}</span>
              </div>
            )}
          </div>

          {/* Order stats for customers */}
          {!isStaff && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <Package size={20} className="text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-700">{user.orderCount ?? 0}</p>
                <p className="text-xs text-blue-600">Đơn hoàn thành</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <TrendingUp size={20} className="text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-700">{formatPrice(user.totalSpent)}</p>
                <p className="text-xs text-green-600">Tổng chi tiêu</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-5 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Quản lý tài khoản</h4>

            {/* Change role: only staff <-> technician; customer stays customer */}
            {isStaff && user.role !== 'admin' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vai trò</label>
                <div className="flex gap-2 flex-wrap">
                  {['staff', 'technician'].map(r => (
                    <button key={r}
                      disabled={isUpdating || user.role === r}
                      onClick={() => onUpdateRole(r)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors disabled:opacity-40
                        ${user.role === r
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-gray-300 hover:border-primary-400 hover:text-primary-600'}`}>
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle status */}
            <div className="flex gap-2">
              {user.status !== 'active' && (
                <button disabled={isUpdating} onClick={() => onUpdateStatus('active')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <UserCheck size={15} /> Kích hoạt
                </button>
              )}
              {user.status === 'active' && (
                <button disabled={isUpdating} onClick={() => onUpdateStatus('inactive')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <UserX size={15} /> Vô hiệu hoá
                </button>
              )}
              {user.status !== 'banned' && user.role !== 'admin' && (
                <button disabled={isUpdating} onClick={() => onUpdateStatus('banned')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <UserX size={15} /> Khoá tài khoản
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateStaffModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', role: 'staff'
  })
  const [showPassword, setShowPassword] = useState(false)

  const create = useMutation({
    mutationFn: () => api.post('/users/admin/staff', form),
    onSuccess: () => { toast.success('Tạo tài khoản thành công'); onSuccess() },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Lỗi tạo tài khoản'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-lg">Thêm tài khoản nhân viên</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Họ tên *</label>
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="input w-full" placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input w-full" placeholder="nhanvien@kinhduanpc.vn" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="input w-full" placeholder="0912345678" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input w-full pr-10" placeholder="Tối thiểu 6 ký tự" />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vai trò *</label>
            <div className="flex gap-3">
              {[
                { value: 'staff', label: 'Nhân viên', desc: 'Xử lý đơn hàng, sản phẩm' },
                { value: 'technician', label: 'Kỹ thuật viên', desc: 'Xử lý yêu cầu sửa chữa' },
              ].map(r => (
                <button key={r.value} type="button"
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`flex-1 p-3 rounded-xl border-2 text-left transition-colors
                    ${form.role === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="font-medium text-sm">{r.label}</p>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="btn-outline flex-1">Hủy</button>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.fullName || !form.email || !form.password}
            className="btn-primary flex-1 disabled:opacity-50">
            {create.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  )
}
