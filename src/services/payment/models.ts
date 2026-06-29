export type PaymentGateway = 'RAZORPAY' | 'PHONEPE' | 'CASHFREE' | 'DEMO';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export type PaymentPurpose = 'REGISTRATION_FEE' | 'DAILY_COLLECTION' | 'COMMISSION_PAYMENT' | 'REFUND';

export interface PaymentRequest {
  amount: number;
  currency: string;
  purpose: PaymentPurpose;
  referenceId: string; // e.g., memberId, collectionId
  customerDetails?: {
    name: string;
    phone: string;
    email?: string;
  };
  gateway: PaymentGateway;
}

export interface PaymentResponse {
  transactionId: string;
  status: TransactionStatus;
  gatewayResponse: any; // Raw response from gateway
  timestamp: string;
  amount: number;
  currency: string;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
}
