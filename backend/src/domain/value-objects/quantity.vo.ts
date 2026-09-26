import { MAX_QUANTITY_PER_PURCHASE } from '@domain/constants/transaction.constants';
import { invalidQuantity } from '@domain/errors/transaction.errors';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';

/**
 * Unidades de un producto en una compra: entero entre 1 y MAX_QUANTITY_PER_PURCHASE.
 * Si existe una instancia, la cantidad es válida.
 */
export class Quantity {
  private constructor(readonly value: number) {}

  static create(value: number): Result<Quantity, AppError> {
    return Number.isInteger(value) &&
      value >= 1 &&
      value <= MAX_QUANTITY_PER_PURCHASE
      ? ok(new Quantity(value))
      : err(invalidQuantity(value));
  }
}
