import { Injectable, Logger, type Provider } from '@nestjs/common';
import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
} from '@application/ports/transaction.repository.port';
import { TRANSACTION_STATUS } from '@domain/constants/transaction.constants';
import type { Transaction } from '@domain/entities/transaction.entity';
import { isFinalStatus } from '@domain/rules/transaction-status.rules';
import type { AppError } from '@shared/errors/app-error';
import { ok, ResultAsync } from '@shared/result';
import { databaseError } from '../database.errors';
import {
  toTransactionCreateData,
  toTransactionView,
  TRANSACTION_VIEW_INCLUDE,
} from '../mappers/transaction.prisma.mapper';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TransactionPrismaRepository implements TransactionRepositoryPort {
  private readonly logger = new Logger(TransactionPrismaRepository.name);

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

  savePaymentResult(transaction: Transaction): ResultAsync<void, AppError> {
    return ResultAsync.fromPromise(
      this.prisma.$transaction((tx) =>
        this.applyPaymentResult(tx, transaction),
      ),
      databaseError,
    );
  }

  /**
   * Dentro de una transacción de base de datos. El UPDATE condicionado a
   * PENDING bloquea la fila: si dos consultas liquidan a la vez, la segunda
   * no encuentra nada que actualizar y no vuelve a descontar stock.
   */
  private async applyPaymentResult(
    tx: Prisma.TransactionClient,
    transaction: Transaction,
  ): Promise<void> {
    const {
      id,
      productId,
      quantity,
      status,
      statusMessage,
      gatewayTransactionId,
      finalizedAt,
      delivery,
    } = transaction.toPlainObject();

    const { count } = await tx.transaction.updateMany({
      where: { id, status: TRANSACTION_STATUS.PENDING },
      data: { status, statusMessage, gatewayTransactionId, finalizedAt },
    });
    if (count === 0 || !isFinalStatus(status)) {
      return;
    }

    await tx.delivery.update({
      where: { transactionId: id },
      data: { status: delivery.status },
    });

    if (status === TRANSACTION_STATUS.APPROVED) {
      const { count: discounted } = await tx.product.updateMany({
        where: { id: productId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (discounted === 0) {
        this.logger.warn(
          `Transaction ${id} was approved without stock for product ${productId}`,
        );
      }
    }
  }
}

export const TRANSACTION_REPOSITORY_PROVIDER: Provider = {
  provide: TRANSACTION_REPOSITORY,
  useClass: TransactionPrismaRepository,
};
