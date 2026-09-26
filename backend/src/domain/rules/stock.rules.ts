import { outOfStock } from '@domain/errors/product.errors';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';

/** Lo mínimo que la regla necesita saber del producto. */
export interface StockContext {
  readonly id: string;
  readonly stock: number;
}

/** Hay unidades suficientes para vender `quantity`; si no, OUT_OF_STOCK. */
export const checkStockAvailable = (
  product: StockContext,
  quantity: number,
): Result<void, AppError> =>
  product.stock >= quantity
    ? ok(undefined)
    : err(outOfStock(product.id, quantity, product.stock));
