import { paymentService } from './service';
import { paymentRepository } from './repository';
import { TransactionStatus } from './models';

export class WebhookHandler {
  async handleRazorpayWebhook(payload: any, signature: string): Promise<void> {
    console.log("[Webhook] Received Razorpay Webhook");
    // Verify signature
    // Parse payload
    // Update transaction status via repository
  }

  async handlePhonePeWebhook(payload: any, checksum: string): Promise<void> {
    console.log("[Webhook] Received PhonePe Webhook");
    // Verify checksum
    // Update transaction status
  }

  async handleCashfreeWebhook(payload: any, signature: string): Promise<void> {
    console.log("[Webhook] Received Cashfree Webhook");
    // Verify signature
    // Update transaction status
  }
  
  // Generic handler for demo/test purposes
  async handleDemoWebhook(transactionId: string, status: TransactionStatus): Promise<void> {
     console.log(`[Webhook] Demo Webhook received for ${transactionId} with status ${status}`);
     await paymentRepository.updateTransactionStatus(transactionId, status);
  }
}

export const webhookHandler = new WebhookHandler();
