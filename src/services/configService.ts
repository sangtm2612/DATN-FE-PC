import api from '@/lib/axios';

export interface OrderConfig {
  codDepositAmount: number;
  autoCancelHours: number;
  autoCompleteDays: number;
  returnDeadlineDays: number;
}

interface ConfigResponse {
  success: boolean;
  data: OrderConfig;
  message: string;
}

/**
 * Lấy cấu hình đơn hàng từ backend
 */
export const getOrderConfig = async (): Promise<OrderConfig> => {
  const response = await api.get<ConfigResponse>('/config/order');
  
  if (response.data.success) {
    return response.data.data;
  }
  
  // Fallback to default values if API fails
  return {
    codDepositAmount: 100000,
    autoCancelHours: 48,
    autoCompleteDays: 7,
    returnDeadlineDays: 15,
  };
};
