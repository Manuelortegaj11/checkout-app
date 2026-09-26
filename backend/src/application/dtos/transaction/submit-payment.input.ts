/** Cobro con tarjeta de una transacción abierta. */
export interface SubmitPaymentInput {
  readonly transactionId: string;
  /** Tarjeta tokenizada en el frontend: el backend nunca recibe el número. */
  readonly cardToken: string;
  readonly installments: number;
  /** Tokens de los dos contratos que el cliente aceptó en el checkout. */
  readonly acceptanceToken: string;
  readonly personalDataAuthToken: string;
}
