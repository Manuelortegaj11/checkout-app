import { appError, type AppError } from '@shared/errors/app-error';

export const productNotFound = (productId: string): AppError =>
  appError('NOT_FOUND', 'PRODUCT_NOT_FOUND', `Product ${productId} not found`);

export const outOfStock = (
  productId: string,
  requested: number,
  available: number,
): AppError =>
  appError(
    'CONFLICT',
    'OUT_OF_STOCK',
    `Product ${productId} has ${available} units available, ${requested} requested`,
  );
