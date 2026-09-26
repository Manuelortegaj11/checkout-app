import { Injectable, type Provider } from '@nestjs/common';
import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
} from '@application/ports/transaction.repository.port';
import { TRANSACTION_STATUS } from '@domain/constants/transaction.constants';
import type { Transaction } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import { ok, ResultAsync } from '@shared/result';
import { databaseError } from '../database.errors';
import {
  toTransactionCreateData,
  toTransactionView,
  TRANSACTION_VIEW_INCLUDE,
} from '../mappers/transaction.prisma.mapper';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TransactionPrismaRepository implements TransactionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  /** La escritura anidada guarda transacción y entrega de forma atómica. */
  create(transaction: Transaction): ResultAsync<void, AppError> {
    return ResultAsync.fromPromise(
      this.prisma.transaction.create({
        data: toTransactionCreateData(transaction),
        select: { id: true },
      }),
      databaseError,
    ).map(() => undefined);
  }

  findViewById(id: string): ResultAsync<TransactionView | null, AppError> {
    return ResultAsync.fromPromise(
      this.prisma.transaction.findUnique({
        where: { id },
        include: TRANSACTION_VIEW_INCLUDE,
      }),
      databaseError,
    ).andThen((row) => (row ? toTransactionView(row) : ok(null)));
  }

  /**
   * UPDATE condicional: PostgreSQL bloquea la fila, así que si dos peticiones
   * llegan a la vez solo una encuentra `payment_submitted_at` vacío.
   */
  claimPaymentSubmission(
    transaction: Transaction,
  ): ResultAsync<boolean, AppError> {
    const { id, paymentSubmittedAt } = transaction.toPlainObject();

    return ResultAsync.fromPromise(
      this.prisma.transaction.updateMany({
        where: {
          id,
          status: TRANSACTION_STATUS.PENDING,
          paymentSubmittedAt: null,
        },
        data: { paymentSubmittedAt },
      }),
      databaseError,
    ).map(({ count }) => count === 1);
  }
}

export const TRANSACTION_REPOSITORY_PROVIDER: Provider = {
  provide: TRANSACTION_REPOSITORY,
  useClass: TransactionPrismaRepository,
};
