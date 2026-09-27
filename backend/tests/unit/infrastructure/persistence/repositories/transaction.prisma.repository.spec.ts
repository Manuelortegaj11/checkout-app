import type { PrismaService } from '@infrastructure/persistence/prisma.service';
import { aTransactionViewRow } from '@testing/fixtures/transaction-row.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  anAwaitingTransaction,
  aPaymentResult,
  aTransaction,
  FINALIZED_AT,
  GATEWAY_TRANSACTION_ID,
  PAYMENT_SUBMITTED_AT,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import {
  toTransactionCreateData,
  TRANSACTION_VIEW_INCLUDE,
} from '@infrastructure/persistence/mappers/transaction.prisma.mapper';
import { TransactionPrismaRepository } from '@infrastructure/persistence/repositories/transaction.prisma.repository';

describe('TransactionPrismaRepository', () => {
  const transactionTable = {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  };
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

  describe('claimPaymentSubmission', () => {
    const claimTx = {
      transaction: {
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      product: {
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    const prismaWithTx = {
      $transaction: jest.fn(
        (work: (client: typeof claimTx) => Promise<unknown>) => work(claimTx),
      ),
    } as unknown as PrismaService;
    const repositoryWithTx = new TransactionPrismaRepository(prismaWithTx);
    const started = () =>
      aTransaction().startPayment(PAYMENT_SUBMITTED_AT)._unsafeUnwrap();

    beforeEach(() => {
      claimTx.transaction.updateMany.mockResolvedValue({ count: 1 });
      claimTx.transaction.update.mockResolvedValue({ id: TRANSACTION_ID });
      claimTx.product.updateMany.mockResolvedValue({ count: 1 });
      claimTx.product.findUnique.mockResolvedValue({ stock: 0 });
    });

    it('reclama el envío y reserva el stock en una transacción', async () => {
      const result = await repositoryWithTx.claimPaymentSubmission(started());

      expect(result._unsafeUnwrap()).toEqual({ claimed: true });
      expect(claimTx.transaction.updateMany).toHaveBeenCalledWith({
        where: {
          id: TRANSACTION_ID,
          status: 'PENDING',
          paymentSubmittedAt: null,
        },
        data: { paymentSubmittedAt: PAYMENT_SUBMITTED_AT },
      });
      expect(claimTx.product.updateMany).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      });
    });

    it('no toca el stock si otra petición ya reclamó el envío', async () => {
      claimTx.transaction.updateMany.mockResolvedValue({ count: 0 });

      const result = await repositoryWithTx.claimPaymentSubmission(started());

      expect(result._unsafeUnwrap()).toEqual({
        claimed: false,
        reason: 'ALREADY_SUBMITTED',
      });
      expect(claimTx.product.updateMany).not.toHaveBeenCalled();
    });

    it('deshace la reclamación si no logra reservar el stock', async () => {
      claimTx.product.updateMany.mockResolvedValue({ count: 0 });
      claimTx.product.findUnique.mockResolvedValue({ stock: 2 });

      const result = await repositoryWithTx.claimPaymentSubmission(started());

      expect(result._unsafeUnwrap()).toEqual({
        claimed: false,
        reason: 'OUT_OF_STOCK',
        available: 2,
      });
      expect(claimTx.transaction.update).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
        data: { paymentSubmittedAt: null },
      });
    });

    it('traduce un fallo de la base de datos a DB_QUERY_FAILED', async () => {
      claimTx.transaction.updateMany.mockRejectedValue(new Error('timeout'));

      const result = await repositoryWithTx.claimPaymentSubmission(started());

      expect(result._unsafeUnwrapErr().code).toBe('DB_QUERY_FAILED');
    });
  });

  describe('savePaymentResult', () => {
    const tx = {
      transaction: { updateMany: jest.fn() },
      delivery: { update: jest.fn() },
      product: { update: jest.fn() },
    };
    const prismaWithTx = {
      $transaction: jest.fn((work: (client: typeof tx) => Promise<void>) =>
        work(tx),
      ),
    } as unknown as PrismaService;
    const repositoryWithTx = new TransactionPrismaRepository(prismaWithTx);

    const settledWith = (status: 'APPROVED' | 'DECLINED') =>
      anAwaitingTransaction()
        .applyPaymentResult(
          aPaymentResult({
            status,
            statusMessage: status === 'DECLINED' ? 'Rechazada' : null,
          }),
          FINALIZED_AT,
        )
        ._unsafeUnwrap();

    beforeEach(() => {
      tx.transaction.updateMany.mockResolvedValue({ count: 1 });
    });

    it('con un cobro aún PENDING solo registra el id de la pasarela', async () => {
      const result = await repositoryWithTx.savePaymentResult(
        anAwaitingTransaction(),
      );

      expect(result.isOk()).toBe(true);
      expect(tx.transaction.updateMany).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID, status: 'PENDING' },
        data: {
          status: 'PENDING',
          statusMessage: null,
          gatewayTransactionId: GATEWAY_TRANSACTION_ID,
          finalizedAt: null,
        },
      });
      expect(tx.delivery.update).not.toHaveBeenCalled();
      expect(tx.product.update).not.toHaveBeenCalled();
    });

    it('con APPROVED liquida estado y entrega sin volver a descontar la reserva', async () => {
      await repositoryWithTx.savePaymentResult(settledWith('APPROVED'));

      expect(tx.transaction.updateMany).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID, status: 'PENDING' },
        data: expect.objectContaining({
          status: 'APPROVED',
          finalizedAt: FINALIZED_AT,
        }) as unknown,
      });
      expect(tx.delivery.update).toHaveBeenCalledWith({
        where: { transactionId: TRANSACTION_ID },
        data: { status: 'ASSIGNED' },
      });
      expect(tx.product.update).not.toHaveBeenCalled();
    });

    it('con DECLINED cancela la entrega y devuelve el stock reservado', async () => {
      await repositoryWithTx.savePaymentResult(settledWith('DECLINED'));

      expect(tx.delivery.update).toHaveBeenCalledWith({
        where: { transactionId: TRANSACTION_ID },
        data: { status: 'CANCELLED' },
      });
      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
        data: { stock: { increment: 1 } },
      });
    });

    it('no hace nada más si otra petición ya la liquidó', async () => {
      tx.transaction.updateMany.mockResolvedValue({ count: 0 });

      const result = await repositoryWithTx.savePaymentResult(
        settledWith('APPROVED'),
      );

      expect(result.isOk()).toBe(true);
      expect(tx.delivery.update).not.toHaveBeenCalled();
      expect(tx.product.update).not.toHaveBeenCalled();
    });

    it('traduce un fallo de la base de datos a DB_QUERY_FAILED', async () => {
      tx.transaction.updateMany.mockRejectedValue(new Error('deadlock'));

      const result = await repositoryWithTx.savePaymentResult(
        settledWith('APPROVED'),
      );

      expect(result._unsafeUnwrapErr().code).toBe('DB_QUERY_FAILED');
    });
  });
});
