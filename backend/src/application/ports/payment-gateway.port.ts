import type { Currency } from '@domain/constants/currency.constants';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export const PAYMENT_GATEWAY_ERROR_CODE = {
  REJECTED: 'PAYMENT_GATEWAY_REJECTED',
  UNAVAILABLE: 'PAYMENT_GATEWAY_UNAVAILABLE',
} as const;

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

/**
 * Lo que el navegador necesita para tokenizar la tarjeta directamente en la
 * pasarela, sin que el número llegue al backend. Son datos públicos: el
 * secreto de integridad nunca sale del backend.
 */
export interface PaymentGatewayPublicSettings {
  /** URL base de la API de la pasarela, sin barra final. */
  readonly baseUrl: string;
  readonly publicKey: string;
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
  /** Configuración pública para tokenizar la tarjeta. No consulta la pasarela: no puede fallar. */
  getPublicSettings(): PaymentGatewayPublicSettings;

  /** Versiones vigentes de los contratos que el cliente debe aceptar. */
  getAcceptanceContracts(): ResultAsync<AcceptanceContracts, AppError>;

  /**
   * Envía el cobro y devuelve inmediatamente la respuesta de creación. Si
   * queda PENDING, el id se persiste antes de esperar su resultado final.
   */
  charge(request: PaymentRequest): ResultAsync<PaymentResult, AppError>;

  /**
   * Espera de forma acotada el resultado final de un cobro ya creado. Una
   * consulta fallida conserva el último estado conocido para sincronizarlo luego.
   */
  waitForFinalStatus(payment: PaymentResult): ResultAsync<PaymentResult, never>;

  /** Estado actual de un cobro ya enviado. */
  getPayment(
    gatewayTransactionId: string,
  ): ResultAsync<PaymentResult, AppError>;
}
