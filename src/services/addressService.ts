import axios from 'axios'

// Dùng API v1 (ổn định hơn) - đủ dùng cho việc lấy địa chỉ
const ADDRESS_API = 'https://provinces.open-api.vn/api'

export interface Province {
  code: number
  name: string
  name_en?: string
  full_name?: string
  full_name_en?: string
  codename: string
  division_type?: string
  phone_code?: number
  districts?: District[]
}

export interface District {
  code: number
  name: string
  name_en?: string
  full_name?: string
  full_name_en?: string
  codename: string
  division_type?: string
  province_code: number
  wards?: Ward[]
}

export interface Ward {
  code: number
  name: string
  name_en?: string
  full_name?: string
  full_name_en?: string
  codename: string
  division_type?: string
  district_code: number
}

export const addressService = {
  // Lấy danh sách tỉnh/thành phố
  getProvinces: async (): Promise<Province[]> => {
    const { data } = await axios.get(`${ADDRESS_API}/p/`)
    return data
  },

  // Lấy tất cả phường/xã của tỉnh (bỏ qua cấp huyện)
  getProvinceDirect: async (provinceCode: number): Promise<Province> => {
    const { data } = await axios.get(`${ADDRESS_API}/p/${provinceCode}?depth=3`)
    return data
  },
}
