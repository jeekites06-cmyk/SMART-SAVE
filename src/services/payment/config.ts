import { PaymentGateway } from './models';

const env = (import.meta as any).env || {};

export const PaymentConfig = {
  isDemoMode: env.VITE_PAYMENT_DEMO_MODE !== 'false', // Default to true
  defaultGateway: (env.VITE_DEFAULT_PAYMENT_GATEWAY as PaymentGateway) || 'DEMO',
  razorpay: {
    keyId: env.VITE_RAZORPAY_KEY_ID || '',
    keySecret: env.VITE_RAZORPAY_KEY_SECRET || '',
  },
  phonepe: {
    merchantId: env.VITE_PHONEPE_MERCHANT_ID || '',
    saltKey: env.VITE_PHONEPE_SALT_KEY || '',
    saltIndex: env.VITE_PHONEPE_SALT_INDEX || '1',
  },
  cashfree: {
    appId: env.VITE_CASHFREE_APP_ID || '',
    secretKey: env.VITE_CASHFREE_SECRET_KEY || '',
    env: env.VITE_CASHFREE_ENV || 'SANDBOX',
  }
};

