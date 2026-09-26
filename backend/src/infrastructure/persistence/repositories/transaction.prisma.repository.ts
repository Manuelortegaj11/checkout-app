import { Injectable, type Provider } from '@nestjs/common';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
} from '@application/ports/transaction.repository.port';
import type { Transaction } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import { ResultAsync } from '@shared/result';
import { databaseError } from '../database.errors';
import { toTransactionCreateData } from '../mappers/transaction.prisma.mapper';
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
}

export const TRANSACTION_REPOSITORY_PROVIDER: Provider = {
  provide: TRANSACTION_REPOSITORY,
  useClass: TransactionPrismaRepository,
};
