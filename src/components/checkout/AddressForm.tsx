import { useState, useEffect } from 'react'
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { addressService } from '@/services/addressService'

interface AddressFormProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  setValue: UseFormSetValue<any>
  watch: UseFormWatch<any>
}

export default function AddressForm({ register, errors, setValue, watch }: AddressFormProps) {
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null)

  const currentProvince = watch('shippingProvince')
  const currentWard = watch('shippingWard')

  const { data: provinces } = useQuery({
    queryKey: ['provinces'],
    queryFn: addressService.getProvinces,
    staleTime: Infinity,
  })

  const { data: wards } = useQuery({
    queryKey: ['wards', selectedProvinceCode],
    queryFn: async () => {
      if (!selectedProvinceCode) return []
      const province = await addressService.getProvinceDirect(selectedProvinceCode)
      return province.districts?.flatMap((d: any) => d.wards || []) || []
    },
    enabled: !!selectedProvinceCode,
  })

  // Khi form được pre-fill từ bên ngoài (ví dụ chọn địa chỉ đã lưu),
  // reset selectedProvinceCode để select không hiển thị sai
  useEffect(() => {
    if (!currentProvince) setSelectedProvinceCode(null)
  }, [currentProvince])

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value)
    const province = provinces?.find(p => p.code === code)
    if (province) {
      setSelectedProvinceCode(code)
      setValue('shippingProvince', province.name)
      setValue('shippingDistrict', province.name)
      setValue('shippingWard', '')
    }
  }

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value)
    const ward = wards?.find((w: any) => w.code === code)
    if (ward) setValue('shippingWard', ward.name)
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố *</label>
        {/* Nếu đã có giá trị pre-fill, hiển thị text và cho phép thay đổi */}
        {currentProvince && !selectedProvinceCode ? (
          <div className="flex items-center gap-2">
            <span className="input bg-gray-50 flex-1 text-gray-700">{currentProvince}</span>
            <button type="button"
              onClick={() => { setValue('shippingProvince', ''); setValue('shippingWard', '') }}
              className="text-xs text-primary-500 hover:underline whitespace-nowrap">Thay đổi</button>
          </div>
        ) : (
          <select onChange={handleProvinceChange} className="input" defaultValue="">
            <option value="" disabled>Chọn tỉnh/thành phố</option>
            {provinces?.map(p => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        )}
        <input type="hidden" {...register('shippingProvince')} />
        <input type="hidden" {...register('shippingDistrict')} />
        {errors.shippingProvince && <p className="text-red-500 text-xs mt-1">{errors.shippingProvince.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã/Thị trấn *</label>
        {currentWard && !selectedProvinceCode ? (
          <div className="flex items-center gap-2">
            <span className="input bg-gray-50 flex-1 text-gray-700">{currentWard}</span>
            <button type="button"
              onClick={() => setValue('shippingWard', '')}
              className="text-xs text-primary-500 hover:underline whitespace-nowrap">Thay đổi</button>
          </div>
        ) : (
          <select onChange={handleWardChange} className="input"
            disabled={!selectedProvinceCode} defaultValue="">
            <option value="" disabled>Chọn phường/xã/thị trấn</option>
            {wards?.map((w: any) => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
        )}
        <input type="hidden" {...register('shippingWard')} />
        {errors.shippingWard && <p className="text-red-500 text-xs mt-1">{errors.shippingWard.message as string}</p>}
      </div>
    </>
  )
}
