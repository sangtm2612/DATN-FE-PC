import { useEffect, useRef, useState } from 'react'
import api from '@/lib/axios'
import { Link2, Upload, X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageInputProps {
  value: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
  previewClass?: string
  // Dimension constraints
  minWidth?: number
  minHeight?: number
  dimensionHint?: string  // e.g. "Khuyến nghị 1920 × 600px • Tỷ lệ 16:5"
}

type DimStatus = 'ok' | 'warn' | 'fail' | 'info'

const DIM_STYLE: Record<DimStatus, string> = {
  ok:   'bg-green-100 text-green-700 border-green-200',
  warn: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  fail: 'bg-red-100 text-red-600 border-red-200',
  info: 'bg-gray-100 text-gray-500 border-gray-200',
}
const DIM_ICON: Record<DimStatus, React.ReactNode> = {
  ok:   <CheckCircle size={11} />,
  warn: <AlertTriangle size={11} />,
  fail: <AlertCircle size={11} />,
  info: <Info size={11} />,
}

function getStatus(w: number, h: number, minW?: number, minH?: number): DimStatus {
  if (!minW && !minH) return 'info'
  const wOk = !minW || w >= minW
  const hOk = !minH || h >= minH
  if (wOk && hOk) return 'ok'
  const wClose = !minW || w >= minW * 0.8
  const hClose = !minH || h >= minH * 0.8
  return wClose && hClose ? 'warn' : 'fail'
}

function loadImageDims(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = reject
    img.src = src
  })
}

export default function ImageInput({
  value, onChange, label,
  placeholder = 'https://...',
  previewClass = 'h-20 w-20 object-contain',
  minWidth, minHeight, dimensionHint,
}: ImageInputProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Check dimensions whenever value changes
  useEffect(() => {
    if (!value) { setDims(null); return }
    let cancelled = false
    loadImageDims(value)
      .then(d => { if (!cancelled) setDims(d) })
      .catch(() => { if (!cancelled) setDims(null) })
    return () => { cancelled = true }
  }, [value])

  const checkFileDims = (file: File): Promise<{ w: number; h: number }> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new window.Image()
      img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }) }
      img.onerror = () => { URL.revokeObjectURL(url); reject() }
      img.src = url
    })

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Chỉ chấp nhận file ảnh'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Ảnh tối đa 10MB'); return }

    // Dimension pre-check
    try {
      const { w, h } = await checkFileDims(file)
      const status = getStatus(w, h, minWidth, minHeight)
      if (status === 'fail') {
        toast.error(
          `Ảnh quá nhỏ (${w}×${h}px). Tối thiểu ${minWidth ?? '?'}×${minHeight ?? '?'}px`,
          { duration: 4000 }
        )
        return
      }
      if (status === 'warn') {
        toast(`Ảnh hơi nhỏ (${w}×${h}px), có thể bị mờ khi hiển thị`, {
          icon: '⚠️', duration: 3500,
        })
      }
    } catch {
      // Can't check dims, proceed anyway
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post<{ data: { url: string } }>('/upload/image', fd)
      onChange(res.data.data.url)
      toast.success('Upload thành công')
    } catch {
      toast.error('Upload thất bại')
    } finally {
      setUploading(false)
    }
  }

  const dimStatus = dims ? getStatus(dims.w, dims.h, minWidth, minHeight) : null

  const dimMessage: Record<DimStatus, string> = {
    ok:   'Kích thước hợp lệ',
    warn: 'Ảnh hơi nhỏ, có thể bị mờ',
    fail: `Quá nhỏ — tối thiểu ${minWidth ?? '?'}×${minHeight ?? '?'}px`,
    info: 'Kích thước ảnh',
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      {/* Mode tabs */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex rounded-lg border overflow-hidden w-fit">
          <button type="button" onClick={() => setMode('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'url' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <Link2 size={12} /> Link URL
          </button>
          <button type="button" onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'upload' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <Upload size={12} /> Tải ảnh lên
          </button>
        </div>
        {dimensionHint && (
          <span className="text-xs text-gray-400 italic">{dimensionHint}</span>
        )}
      </div>

      {mode === 'url' ? (
        <div className="relative">
          <input value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} className="input pr-8" />
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 flex flex-col items-center gap-1.5 text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {uploading ? (
              <span className="text-sm">Đang upload...</span>
            ) : (
              <>
                <Upload size={20} />
                <span className="text-sm font-medium">Chọn ảnh để upload</span>
                <span className="text-xs text-gray-400">
                  PNG, JPG, WEBP — tối đa 10MB
                  {minWidth && minHeight && ` • Tối thiểu ${minWidth}×${minHeight}px`}
                </span>
              </>
            )}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="mt-1 text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
              <X size={12} /> Xóa ảnh hiện tại
            </button>
          )}
        </div>
      )}

      {/* Preview + dim badge */}
      {value && (
        <div className="mt-2 flex items-start gap-3">
          <img src={value} alt="preview" className={`${previewClass} rounded-lg border bg-gray-50 flex-shrink-0`}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          {dims && dimStatus && (
            <div className="flex flex-col gap-1 pt-0.5">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${DIM_STYLE[dimStatus]}`}>
                {DIM_ICON[dimStatus]}
                {dims.w} × {dims.h}px
              </span>
              {dimStatus !== 'info' && (
                <span className="text-xs text-gray-400">{dimMessage[dimStatus]}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
