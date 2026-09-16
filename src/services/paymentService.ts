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
 * @param orderId - ID đơn hàng
 * @param amount - Số tiền thanh toán (tùy chọn, để trống = thanh toán toàn bộ)
 */
export const createVNPayPayment = async (orderId: number, amount?: number): Promise<string> => {
  const params: any = { orderId };
  if (amount !== undefined) {
    params.amount = amount;
  }
  
  const response = await api.post<PaymentResponse>(
    '/payments/vnpay/create',
    null,
    { params }
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
 * @param orderId - ID đơn hàng
 * @param amount - Số tiền thanh toán (tùy chọn, để trống = thanh toán toàn bộ)
 */
export const createZaloPayPayment = async (orderId: number, amount?: number): Promise<string> => {
  const params: any = { orderId };
  if (amount !== undefined) {
    params.amount = amount;
  }
  
  const response = await api.post<PaymentResponse>(
    '/payments/zalopay/create',
    null,
    { params }
  );

  if (response.data.success) {
    return response.data.data.paymentUrl;
  }
  
  throw new Error(response.data.message || 'Không thể tạo URL thanh toán ZaloPay');
};
