import type { TransactionRepositoryPort } from '@application/ports/transaction.repository.port';

export const mockTransactionRepository =
  (): jest.Mocked<TransactionRepositoryPort> => ({
    create: jest.fn(),
  });
