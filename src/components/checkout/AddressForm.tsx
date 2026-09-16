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

  // Lấy danh sách tỉnh/thành phố
  const { data: provinces } = useQuery({
    queryKey: ['provinces'],
    queryFn: addressService.getProvinces,
    staleTime: Infinity,
  })

  // Lấy danh sách phường/xã theo tỉnh (bỏ cấp huyện)
  const { data: wards } = useQuery({
    queryKey: ['wards', selectedProvinceCode],
    queryFn: async () => {
      if (!selectedProvinceCode) return []
      // Lấy province với depth=3 để có tất cả wards
      const province = await addressService.getProvinceDirect(selectedProvinceCode)
      // Flatten tất cả wards từ các districts
      const allWards = province.districts?.flatMap(d => d.wards || []) || []
      return allWards
    },
    enabled: !!selectedProvinceCode,
  })

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value)
    const province = provinces?.find(p => p.code === code)
    
    if (province) {
      setSelectedProvinceCode(code)
      setValue('shippingProvince', province.name)
      
      // Reset ward và set district = province name (vì bỏ cấp huyện)
      setValue('shippingDistrict', province.name)
      setValue('shippingWard', '')
    }
  }

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value)
    const ward = wards?.find(w => w.code === code)
    
    if (ward) {
      setValue('shippingWard', ward.name)
    }
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố *</label>
        <select 
          onChange={handleProvinceChange}
          className="input"
          defaultValue=""
        >
          <option value="" disabled>Chọn tỉnh/thành phố</option>
          {provinces?.map(p => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
        <input type="hidden" {...register('shippingProvince')} />
        <input type="hidden" {...register('shippingDistrict')} />
        {errors.shippingProvince && <p className="text-red-500 text-xs mt-1">{errors.shippingProvince.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã/Thị trấn *</label>
        <select 
          onChange={handleWardChange}
          className="input"
          disabled={!selectedProvinceCode}
          defaultValue=""
        >
          <option value="" disabled>Chọn phường/xã/thị trấn</option>
          {wards?.map(w => (
            <option key={w.code} value={w.code}>{w.name}</option>
          ))}
        </select>
        <input type="hidden" {...register('shippingWard')} />
        {errors.shippingWard && <p className="text-red-500 text-xs mt-1">{errors.shippingWard.message as string}</p>}
      </div>
    </>
  )
}
