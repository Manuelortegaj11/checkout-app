import { appError, type AppError } from '@shared/errors/app-error';

/**
 * La pasarela no respondió, respondió con error o con una forma inesperada.
 * El detalle queda en `cause` para el log; el cliente recibe un 502 genérico.
 */
export const paymentGatewayUnavailable = (cause: unknown): AppError =>
  appError(
    'EXTERNAL_SERVICE',
    'PAYMENT_GATEWAY_UNAVAILABLE',
    'Payment gateway is unavailable',
    cause,
  );

/**
 * La pasarela recibió el cobro y lo rechazó por datos inválidos: firma, token
 * de tarjeta o de aceptación ya usado o vencido, referencia repetida…
 */
export const paymentGatewayRejected = (cause: unknown): AppError =>
  appError(
    'EXTERNAL_SERVICE',
    'PAYMENT_GATEWAY_REJECTED',
    'Payment gateway rejected the request',
    cause,
  );
