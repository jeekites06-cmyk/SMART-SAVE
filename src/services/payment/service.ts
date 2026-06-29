import { PaymentRequest, PaymentResponse, RefundRequest, TransactionStatus } from './models';
import { PaymentConfig } from './config';
import { paymentRepository } from './repository';

export class PaymentService {
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    const gateway = PaymentConfig.isDemoMode ? 'DEMO' : request.gateway;
    
    console.log(`[PaymentService] Initiating ${request.purpose} payment via ${gateway} for ${request.amount}`);
    
    // Simulate Gateway Processing
    const response: PaymentResponse = {
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'PENDING',
      gatewayResponse: { demo: true },
      timestamp: new Date().toISOString(),
      amount: request.amount,
      currency: request.currency || 'INR'
    };
    
    await paymentRepository.saveTransaction(response);
    return response;
  }

  async verifyPayment(transactionId: string): Promise<TransactionStatus> {
    console.log(`[PaymentService] Verifying payment for ${transactionId}`);
    const tx = await paymentRepository.getTransaction(transactionId);
    
    if (!tx) {
      throw new Error("Transaction not found");
    }

    // In Demo mode, we just return SUCCESS after verification
    if (PaymentConfig.isDemoMode) {
      await paymentRepository.updateTransactionStatus(transactionId, 'SUCCESS');
      return 'SUCCESS';
    }

    // Here we would call the respective gateway APIs to verify
    return tx.status;
  }

  async processRefund(request: RefundRequest): Promise<PaymentResponse> {
    console.log(`[PaymentService] Processing refund for ${request.transactionId}`);
    const tx = await paymentRepository.getTransaction(request.transactionId);
    
    if (!tx) {
      throw new Error("Transaction not found");
    }

    if (PaymentConfig.isDemoMode) {
      await paymentRepository.updateTransactionStatus(request.transactionId, 'REFUNDED');
      tx.status = 'REFUNDED';
      return tx;
    }

    // Here we would call gateway refund API
    return tx;
  }
}

export const paymentService = new PaymentService();
