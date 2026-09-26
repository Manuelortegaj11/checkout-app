import type { Currency } from '@domain/constants/currency.constants';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

/** Documento legal que el cliente debe aceptar antes de pagar. */
export interface AcceptanceContract {
  /** Prueba de que se mostró esta versión del documento; se envía al cobrar. */
  readonly token: string;
  /** Enlace al documento para que el cliente lo lea. */
  readonly url: string;
}

export interface AcceptanceContracts {
  readonly endUserPolicy: AcceptanceContract;
  readonly personalDataAuth: AcceptanceContract;
}

/** Cobro con tarjeta de una transacción. */
export interface PaymentRequest {
  /** Referencia única de la transacción: la pasarela rechaza una repetida. */
  readonly reference: string;
  readonly amountInCents: number;
  readonly currency: Currency;
  readonly customerEmail: string;
  /** Tarjeta ya tokenizada en el frontend: el backend nunca ve el número. */
  readonly cardToken: string;
  readonly installments: number;
  /** Tokens de los dos contratos aceptados. Son de un solo uso. */
  readonly acceptanceToken: string;
  readonly personalDataAuthToken: string;
}

/** Pasarela de pagos externa. */
export interface PaymentGatewayPort {
  /** Versiones vigentes de los contratos que el cliente debe aceptar. */
  getAcceptanceContracts(): ResultAsync<AcceptanceContracts, AppError>;

  /**
   * Envía el cobro. Espera unos segundos a que llegue a un estado final; si no
   * llega, devuelve PENDING y el resultado se consulta después con `getPayment`.
   */
  charge(request: PaymentRequest): ResultAsync<PaymentResult, AppError>;

  /** Estado actual de un cobro ya enviado. */
  getPayment(
    gatewayTransactionId: string,
  ): ResultAsync<PaymentResult, AppError>;
}
