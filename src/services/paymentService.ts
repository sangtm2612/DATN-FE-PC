import api from '@/lib/axios';

export interface VNPayPaymentResponse {
  success: boolean;
  data: {
    paymentUrl: string;
  };
  message: string;
}

/**
 * Tạo URL thanh toán VNPay
 */
export const createVNPayPayment = async (orderId: number): Promise<string> => {
  const response = await api.post<VNPayPaymentResponse>(
    '/payments/vnpay/create',
    null,
    {
      params: { orderId },
    }
  );

  if (response.data.success) {
    return response.data.data.paymentUrl;
  }
  
  throw new Error(response.data.message || 'Không thể tạo URL thanh toán');
};
