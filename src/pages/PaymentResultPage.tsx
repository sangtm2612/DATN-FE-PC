import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const success = searchParams.get('success') === 'true';
  const message = searchParams.get('message') || '';
  const orderCode = searchParams.get('orderCode') || '';
  const transactionId = searchParams.get('transactionId') || '';

  useEffect(() => {
    // Countdown và redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (success) {
            navigate(`/account/orders`);
          } else {
            navigate('/cart');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [success, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {success ? (
              <CheckCircle className="w-20 h-20 text-green-500" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500" />
            )}
          </div>

          {/* Title */}
          <h1
            className={`text-2xl font-bold mb-4 ${
              success ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">{message}</p>

          {/* Order Info */}
          {success && orderCode && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold">{orderCode}</span>
                </div>
                {transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã giao dịch:</span>
                    <span className="font-semibold">{transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
            <Loader className="w-4 h-4 animate-spin" />
            <span>
              Tự động chuyển hướng sau {countdown} giây...
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {success ? (
              <>
                <button
                  onClick={() => navigate('/account/orders')}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Xem đơn hàng
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Trang chủ
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/cart')}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Quay lại giỏ hàng
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Trang chủ
                </button>
              </>
            )}
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Cần hỗ trợ? Liên hệ{' '}
          <a href="tel:1900xxxx" className="text-blue-600 hover:underline">
            1900 xxxx
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
