import { Injectable, type Provider } from '@nestjs/common';
import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import {
  TRANSACTION_REPOSITORY,
  type PaymentSubmissionClaim,
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

  /** Reclama el envío y reserva el stock dentro de la misma transacción. */
  claimPaymentSubmission(
    transaction: Transaction,
  ): ResultAsync<PaymentSubmissionClaim, AppError> {
    return ResultAsync.fromPromise(
      this.prisma.$transaction((tx) =>
        this.claimPaymentAndReserveStock(tx, transaction),
      ),
      databaseError,
    );
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
   * no encuentra nada que actualizar y no devuelve dos veces la reserva.
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

    if (status !== TRANSACTION_STATUS.APPROVED) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });
    }
  }

  /**
   * El UPDATE de la transacción serializa los envíos duplicados; el UPDATE
   * condicionado del producto serializa compradores de la última unidad.
   */
  private async claimPaymentAndReserveStock(
    tx: Prisma.TransactionClient,
    transaction: Transaction,
  ): Promise<PaymentSubmissionClaim> {
    const { id, productId, quantity, paymentSubmittedAt } =
      transaction.toPlainObject();

    const { count: claimed } = await tx.transaction.updateMany({
      where: {
        id,
        status: TRANSACTION_STATUS.PENDING,
        paymentSubmittedAt: null,
      },
      data: { paymentSubmittedAt },
    });
    if (claimed === 0) {
      return { claimed: false, reason: 'ALREADY_SUBMITTED' };
    }

    const { count: reserved } = await tx.product.updateMany({
      where: { id: productId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (reserved === 1) {
      return { claimed: true };
    }

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    await tx.transaction.update({
      where: { id },
      data: { paymentSubmittedAt: null },
    });

    return {
      claimed: false,
      reason: 'OUT_OF_STOCK',
      available: product?.stock ?? 0,
    };
  }
}

export const TRANSACTION_REPOSITORY_PROVIDER: Provider = {
  provide: TRANSACTION_REPOSITORY,
  useClass: TransactionPrismaRepository,
};
