import { appError, type AppError } from '@shared/errors/app-error';

export const productNotFound = (productId: string): AppError =>
  appError('NOT_FOUND', 'PRODUCT_NOT_FOUND', `Product ${productId} not found`);
