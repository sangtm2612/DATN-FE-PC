import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import { Clock, User, CheckCircle, XCircle, Wrench, FileText, DollarSign, UserCheck, Tag } from 'lucide-react'

interface AuditEntry {
  id: number
  action: string
  fromValue: string | null
  toValue: string | null
  note: string | null
  performedByName: string
  performedByRole: string
  createdAt: string
}

type EntityType = 'RETURN_REQUEST' | 'SERVICE_REQUEST' | 'WARRANTY' | 'VOUCHER_POLICY'

interface Props {
  entityType: EntityType
  entityId: number
}

const ACTION_META: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  STATUS_CHANGED:      { label: 'Đổi trạng thái',    icon: CheckCircle,  color: 'text-blue-500'   },
  NOTE_ADDED:          { label: 'Thêm ghi chú',       icon: FileText,     color: 'text-gray-500'   },
  COST_QUOTED:         { label: 'Báo giá',            icon: DollarSign,   color: 'text-orange-500' },
  DIAGNOSIS_SET:       { label: 'Chẩn đoán',          icon: Wrench,       color: 'text-purple-500' },
  TECHNICIAN_ASSIGNED: { label: 'Phân kỹ thuật viên', icon: UserCheck,    color: 'text-indigo-500' },
  SERIAL_UPDATED:      { label: 'Cập nhật serial',    icon: Tag,          color: 'text-teal-500'   },
  POLICY_CREATED:      { label: 'Tạo chính sách',     icon: CheckCircle,  color: 'text-green-500'  },
  POLICY_UPDATED:      { label: 'Cập nhật chính sách',icon: FileText,     color: 'text-blue-500'   },
  POLICY_DELETED:      { label: 'Xóa chính sách',     icon: XCircle,      color: 'text-red-500'    },
  POLICY_TOGGLED:      { label: 'Bật/tắt chính sách', icon: CheckCircle,  color: 'text-yellow-500' },
}

const STATUS_VI: Record<string, string> = {
  pending: 'Chờ xử lý', reviewing: 'Đang xem xét', approved: 'Đã duyệt',
  rejected: 'Từ chối', completed: 'Hoàn tất',
  received: 'Đã tiếp nhận', diagnosing: 'Đang chẩn đoán', repairing: 'Đang sửa',
  waiting_part: 'Chờ linh kiện', done: 'Hoàn thành', returned: 'Đã trả máy',
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  staff: 'bg-blue-100 text-blue-700',
  technician: 'bg-purple-100 text-purple-700',
  customer: 'bg-green-100 text-green-700',
  system: 'bg-gray-100 text-gray-500',
}

function formatValue(val: string | null) {
  if (!val) return null
  return STATUS_VI[val] ?? val
}

export default function AuditTimeline({ entityType, entityId }: Props) {
  const { data: logs = [], isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['audit-log', entityType, entityId],
    queryFn: () =>
      api.get<{ data: AuditEntry[] }>(`/audit-logs/${entityType}/${entityId}`)
        .then(r => r.data.data || []),
    enabled: !!entityId,
  })

  if (isLoading) return <p className="text-xs text-gray-400 py-2">Đang tải lịch sử...</p>
  if (!logs.length) return <p className="text-xs text-gray-400 py-2">Chưa có lịch sử thao tác.</p>

  return (
    <div className="relative pl-6 space-y-0">
      {/* vertical line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-200" />

      {logs.map((entry, idx) => {
        const meta = ACTION_META[entry.action] ?? { label: entry.action, icon: Clock, color: 'text-gray-400' }
        const Icon = meta.icon
        const roleCls = ROLE_BADGE[entry.performedByRole] ?? ROLE_BADGE.system
        const isLast = idx === logs.length - 1

        return (
          <div key={entry.id} className={`relative flex gap-3 ${isLast ? '' : 'pb-4'}`}>
            {/* dot */}
            <div className={`absolute -left-6 w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center flex-shrink-0
              ${meta.color.replace('text-', 'border-')}`}>
              <Icon size={10} className={meta.color} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-700">{meta.label}</span>
                {entry.fromValue && entry.toValue && (
                  <span className="text-xs text-gray-500">
                    <span className="line-through text-gray-400">{formatValue(entry.fromValue)}</span>
                    {' → '}
                    <span className="font-medium text-gray-700">{formatValue(entry.toValue)}</span>
                  </span>
                )}
                {!entry.fromValue && entry.toValue && (
                  <span className="text-xs font-medium text-gray-700">{formatValue(entry.toValue)}</span>
                )}
              </div>

              {entry.note && (
                <p className="text-xs text-gray-500 mt-0.5 italic">"{entry.note}"</p>
              )}

              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <User size={10} />
                  <span>{entry.performedByName}</span>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${roleCls}`}>
                  {entry.performedByRole}
                </span>
                <span className="text-[10px] text-gray-400">
                  {formatDate(entry.createdAt, 'HH:mm DD/MM/YYYY')}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
