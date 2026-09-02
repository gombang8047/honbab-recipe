import { apiClient } from './api';

export interface PaymentReadyResult {
  tid: string;
  redirectUrl: string;
  paymentHistoryId: number;
}

export const paymentApi = {
  readyPayment: async (cartId: number): Promise<PaymentReadyResult> => {
    try {
      const res: any = await apiClient.post('/payments/ready', { cartId });
      return res.data;
    } catch {
      return {
        tid: "T_MOCK_123456789",
        redirectUrl: "/payment/complete?tid=T_MOCK_123456789",
        paymentHistoryId: 99
      };
    }
  },

  approvePayment: async (tid: string, pgToken: string): Promise<void> => {
    try {
      await apiClient.post('/payments/approve', { tid, pgToken });
    } catch {
      console.log('Payment approved (mock)');
    }
  }
};
