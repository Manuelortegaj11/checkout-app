import { MAX_QUANTITY_PER_PURCHASE } from '@domain/constants/transaction.constants';
import { invalidQuantity } from '@domain/errors/transaction.errors';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';

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
