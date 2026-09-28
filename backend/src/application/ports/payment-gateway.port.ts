import type { Currency } from '@domain/constants/currency.constants';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export const PAYMENT_GATEWAY_ERROR_CODE = {
  REJECTED: 'PAYMENT_GATEWAY_REJECTED',
  UNAVAILABLE: 'PAYMENT_GATEWAY_UNAVAILABLE',
} as const;

export interface AcceptanceContract {
  readonly token: string;

  readonly url: string;
}

export interface AcceptanceContracts {
  readonly endUserPolicy: AcceptanceContract;
  readonly personalDataAuth: AcceptanceContract;
}

export interface PaymentGatewayPublicSettings {
  readonly baseUrl: string;
  readonly publicKey: string;
}

export interface PaymentRequest {
  readonly reference: string;
  readonly amountInCents: number;
  readonly currency: Currency;
  readonly customerEmail: string;

  readonly cardToken: string;
  readonly installments: number;

  readonly acceptanceToken: string;
  readonly personalDataAuthToken: string;
}

export interface PaymentGatewayPort {
  getPublicSettings(): PaymentGatewayPublicSettings;

  getAcceptanceContracts(): ResultAsync<AcceptanceContracts, AppError>;

  charge(request: PaymentRequest): ResultAsync<PaymentResult, AppError>;

  waitForFinalStatus(payment: PaymentResult): ResultAsync<PaymentResult, never>;

  getPayment(
    gatewayTransactionId: string,
  ): ResultAsync<PaymentResult, AppError>;
}
