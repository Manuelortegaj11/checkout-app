import { apiUrl, requestJson } from './http-client';

/** Estados de una transacción; coinciden con los de la pasarela de pagos. */
export type TransactionStatus =
  'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';

export type DeliveryStatus = 'PENDING_PAYMENT' | 'ASSIGNED' | 'CANCELLED';

/** Desglose del cobro, calculado por el backend. Montos en centavos. */
export interface TransactionAmounts {
  currency: string;
  unitPriceInCents: number;
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
}

/** Transacción tal como la devuelve la API (`TransactionResponse`). */
export interface Transaction {
  id: string;
  reference: string;
  status: TransactionStatus;
  /** Motivo que da la pasarela, por ejemplo al rechazar el pago. */
  statusMessage: string | null;
  /** El cobro ya se envió a la pasarela. */
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
  /** ISO 8601 UTC. */
  createdAt: string;
  /** ISO 8601 UTC; `null` mientras siga PENDING. */
  finalizedAt: string | null;
}

/** Compra que se abre en PENDING. Los montos no se envían: los calcula el backend. */
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

/** Cobro de una transacción: solo tokens, nunca los datos de la tarjeta. */
export interface SubmitPaymentRequest {
  cardToken: string;
  installments: number;
  acceptanceToken: string;
  personalDataAuthToken: string;
}

const transactionUrl = (id: string, path = '') =>
  apiUrl(`/transactions/${encodeURIComponent(id)}${path}`);

export const transactionsApi = {
  /** Abre la compra en PENDING. Todavía no cobra. */
  create: (request: CreateTransactionRequest): Promise<Transaction> =>
    requestJson<Transaction>(apiUrl('/transactions'), {
      method: 'POST',
      body: request,
    }),

  /**
   * Cobra la transacción. Responde con el estado final o, si la pasarela aún
   * no decide, con PENDING. Un pago rechazado no es un error: llega DECLINED.
   * La pasarela puede tardar hasta ~10 s en responder: el tiempo límite da margen.
   */
  pay: (id: string, payment: SubmitPaymentRequest): Promise<Transaction> =>
    requestJson<Transaction>(transactionUrl(id, '/payment'), {
      method: 'POST',
      body: payment,
      timeoutMs: 30_000,
    }),

  /** Estado actual; si el cobro sigue pendiente, el backend lo sincroniza con la pasarela. */
  get: (id: string): Promise<Transaction> =>
    requestJson<Transaction>(transactionUrl(id)),
};
