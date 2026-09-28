import { apiUrl, requestJson } from './http-client';

export type TransactionStatus =
  'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';

export type DeliveryStatus = 'PENDING_PAYMENT' | 'ASSIGNED' | 'CANCELLED';

export interface TransactionAmounts {
  currency: string;
  unitPriceInCents: number;
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
}

export interface Transaction {
  id: string;
  reference: string;
  status: TransactionStatus;

  statusMessage: string | null;

  paymentSubmitted: boolean;
  quantity: number;
  product: { id: string; name: string; imageUrl: string };
  amounts: TransactionAmounts;
  customer: { fullName: string; email: string };
  delivery: {
    status: DeliveryStatus;
    recipientName: string;
    addressLine1: string;
    city: string;
    region: string;
  };

  createdAt: string;

  finalizedAt: string | null;
}

export interface CreateTransactionRequest {
  productId: string;
  quantity: number;
  customer: { fullName: string; email: string; phone: string };
  delivery: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    postalCode?: string;
  };
}

export interface SubmitPaymentRequest {
  cardToken: string;
  installments: number;
  acceptanceToken: string;
  personalDataAuthToken: string;
}

const transactionUrl = (id: string, path = '') =>
  apiUrl(`/transactions/${encodeURIComponent(id)}${path}`);

export const transactionsApi = {
  create: (request: CreateTransactionRequest): Promise<Transaction> =>
    requestJson<Transaction>(apiUrl('/transactions'), {
      method: 'POST',
      body: request,
    }),

  pay: (id: string, payment: SubmitPaymentRequest): Promise<Transaction> =>
    requestJson<Transaction>(transactionUrl(id, '/payment'), {
      method: 'POST',
      body: payment,
      timeoutMs: 30_000,
    }),

  get: (id: string): Promise<Transaction> =>
    requestJson<Transaction>(transactionUrl(id)),
};
