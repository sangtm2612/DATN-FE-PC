import api from '@/lib/axios';

export interface PaymentResponse {
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
  const response = await api.post<PaymentResponse>(
    '/payments/vnpay/create',
    null,
    {
      params: { orderId },
    }
  );

  if (response.data.success) {
    return response.data.data.paymentUrl;
  }
  
  throw new Error(response.data.message || 'Không thể tạo URL thanh toán VNPay');
};

/**
 * Tạo URL thanh toán MoMo
 */
export const createMoMoPayment = async (orderId: number): Promise<string> => {
  const response = await api.post<PaymentResponse>(
    '/payments/momo/create',
    null,
    {
      params: { orderId },
    }
  );

  if (response.data.success) {
    return response.data.data.paymentUrl;
  }
  
  throw new Error(response.data.message || 'Không thể tạo URL thanh toán MoMo');
};

/**
 * Tạo URL thanh toán ZaloPay
 */
export const createZaloPayPayment = async (orderId: number): Promise<string> => {
  const response = await api.post<PaymentResponse>(
    '/payments/zalopay/create',
    null,
    {
      params: { orderId },
    }
  );

  if (response.data.success) {
    return response.data.data.paymentUrl;
  }
  
  throw new Error(response.data.message || 'Không thể tạo URL thanh toán ZaloPay');
};
