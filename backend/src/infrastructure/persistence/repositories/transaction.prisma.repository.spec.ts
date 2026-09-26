import type { PrismaService } from '@infrastructure/persistence/prisma.service';
import { aTransactionViewRow } from '@testing/fixtures/transaction-row.fixture';
import {
  aTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import {
  toTransactionCreateData,
  TRANSACTION_VIEW_INCLUDE,
} from '../mappers/transaction.prisma.mapper';
import { TransactionPrismaRepository } from './transaction.prisma.repository';

describe('TransactionPrismaRepository', () => {
  const transactionTable = { create: jest.fn(), findUnique: jest.fn() };
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

  describe('findViewById', () => {
    it('carga la transacción con su entrega, producto y cliente en una consulta', async () => {
      transactionTable.findUnique.mockResolvedValue(aTransactionViewRow());

      const result = await repository.findViewById(TRANSACTION_ID);

      expect(transactionTable.findUnique).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
        include: TRANSACTION_VIEW_INCLUDE,
      });
      expect(result._unsafeUnwrap()?.transaction.id).toBe(TRANSACTION_ID);
    });

    it('devuelve null si no existe', async () => {
      transactionTable.findUnique.mockResolvedValue(null);

      const result = await repository.findViewById(TRANSACTION_ID);

      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('traduce un fallo de la base de datos a DB_QUERY_FAILED', async () => {
      transactionTable.findUnique.mockRejectedValue(new Error('timeout'));

      const result = await repository.findViewById(TRANSACTION_ID);

      expect(result._unsafeUnwrapErr().code).toBe('DB_QUERY_FAILED');
    });
  });
});
