import { PaymentResponse, TransactionStatus } from './models';

// In a real app, this would connect to the database (e.g. Firestore, SQL)
export class PaymentRepository {
  private transactions: Map<string, PaymentResponse> = new Map();

  async saveTransaction(response: PaymentResponse): Promise<void> {
    this.transactions.set(response.transactionId, response);
    // Log to DataContext/Audit if needed in future
  }

  async getTransaction(transactionId: string): Promise<PaymentResponse | undefined> {
    return this.transactions.get(transactionId);
  }

  async updateTransactionStatus(transactionId: string, status: TransactionStatus): Promise<void> {
    const tx = this.transactions.get(transactionId);
    if (tx) {
      tx.status = status;
      this.transactions.set(transactionId, tx);
    }
  }
}

export const paymentRepository = new PaymentRepository();
