import type { PrismaService } from '@infrastructure/persistence/prisma.service';
import {
  aTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { toTransactionCreateData } from '../mappers/transaction.prisma.mapper';
import { TransactionPrismaRepository } from './transaction.prisma.repository';

describe('TransactionPrismaRepository', () => {
  const transactionTable = { create: jest.fn() };
  const prisma = { transaction: transactionTable } as unknown as PrismaService;
  const repository = new TransactionPrismaRepository(prisma);

  describe('create', () => {
    it('guarda la transacción con su entrega en una sola escritura', async () => {
      transactionTable.create.mockResolvedValue({ id: TRANSACTION_ID });
      const transaction = aTransaction();

      const result = await repository.create(transaction);

      expect(result.isOk()).toBe(true);
      expect(transactionTable.create).toHaveBeenCalledWith({
        data: toTransactionCreateData(transaction),
        select: { id: true },
      });
    });

    it('traduce un fallo de la base de datos a DB_QUERY_FAILED', async () => {
      const cause = new Error('foreign key constraint failed');
      transactionTable.create.mockRejectedValue(cause);

      const result = await repository.create(aTransaction());

      expect(result._unsafeUnwrapErr()).toMatchObject({
        code: 'DB_QUERY_FAILED',
        cause,
      });
    });
  });
});
