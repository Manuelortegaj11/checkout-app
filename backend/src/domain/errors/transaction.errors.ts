import { MAX_QUANTITY_PER_PURCHASE } from '@domain/constants/transaction.constants';
import { appError, type AppError } from '@shared/errors/app-error';

export const invalidQuantity = (quantity: number): AppError =>
  appError(
    'VALIDATION',
    'INVALID_QUANTITY',
    `Quantity must be an integer between 1 and ${MAX_QUANTITY_PER_PURCHASE}, got ${quantity}`,
  );

export const transactionNotFound = (transactionId: string): AppError =>
  appError(
    'NOT_FOUND',
    'TRANSACTION_NOT_FOUND',
    `Transaction ${transactionId} not found`,
  );

/** Ya llegó a un estado final: no admite otro pago ni otro resultado. */
export const transactionAlreadyResolved = (transactionId: string): AppError =>
  appError(
    'CONFLICT',
    'TRANSACTION_ALREADY_RESOLVED',
    `Transaction ${transactionId} is already resolved`,
  );

/** El cobro ya se envió a la pasarela: reenviarlo podría cobrar dos veces. */
export const paymentAlreadySubmitted = (transactionId: string): AppError =>
  appError(
    'CONFLICT',
    'PAYMENT_ALREADY_SUBMITTED',
    `Payment for transaction ${transactionId} was already submitted`,
  );
