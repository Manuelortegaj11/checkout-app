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

/** Pasarela de pagos externa. */
export interface PaymentGatewayPort {
  /** Versiones vigentes de los contratos que el cliente debe aceptar. */
  getAcceptanceContracts(): ResultAsync<AcceptanceContracts, AppError>;
}
