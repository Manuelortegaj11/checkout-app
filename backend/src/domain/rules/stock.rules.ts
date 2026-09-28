import { outOfStock } from '@domain/errors/product.errors';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';

export interface StockContext {
  readonly id: string;
  readonly stock: number;
}

export const checkStockAvailable = (
  product: StockContext,
  quantity: number,
): Result<void, AppError> =>
  product.stock >= quantity
    ? ok(undefined)
    : err(outOfStock(product.id, quantity, product.stock));
