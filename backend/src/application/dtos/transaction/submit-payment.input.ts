export interface SubmitPaymentInput {
  readonly transactionId: string;

  readonly cardToken: string;
  readonly installments: number;

  readonly acceptanceToken: string;
  readonly personalDataAuthToken: string;
}
