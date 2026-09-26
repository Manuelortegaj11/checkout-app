import { MAX_QUANTITY_PER_PURCHASE } from '@domain/constants/transaction.constants';
import { appError, type AppError } from '@shared/errors/app-error';

export const invalidQuantity = (quantity: number): AppError =>
  appError(
    'VALIDATION',
    'INVALID_QUANTITY',
    `Quantity must be an integer between 1 and ${MAX_QUANTITY_PER_PURCHASE}, got ${quantity}`,
  );
