import { PAYMENT_GATEWAY_ERROR_CODE } from '@application/ports/payment-gateway.port';
import { appError, type AppError } from '@shared/errors/app-error';

export const paymentGatewayUnavailable = (cause: unknown): AppError =>
  appError(
    'EXTERNAL_SERVICE',
    PAYMENT_GATEWAY_ERROR_CODE.UNAVAILABLE,
    'Payment gateway is unavailable',
    cause,
  );

export const paymentGatewayRejected = (cause: unknown): AppError =>
  appError(
    'EXTERNAL_SERVICE',
    PAYMENT_GATEWAY_ERROR_CODE.REJECTED,
    'Payment gateway rejected the request',
    cause,
  );
