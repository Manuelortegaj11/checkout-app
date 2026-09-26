import { Logger } from '@nestjs/common';
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
    const started = () =>
      aTransaction().startPayment(PAYMENT_SUBMITTED_AT)._unsafeUnwrap();

    it('reserva el envío solo si sigue PENDING y nadie lo envió antes', async () => {
      transactionTable.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.claimPaymentSubmission(started());

      expect(result._unsafeUnwrap()).toBe(true);
      expect(transactionTable.updateMany).toHaveBeenCalledWith({
        where: {
          id: TRANSACTION_ID,
          status: 'PENDING',
          paymentSubmittedAt: null,
        },
        data: { paymentSubmittedAt: PAYMENT_SUBMITTED_AT },
      });
    });

    it('devuelve false si otra petición se adelantó', async () => {
      transactionTable.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.claimPaymentSubmission(started());

      expect(result._unsafeUnwrap()).toBe(false);
    });

    it('traduce un fallo de la base de datos a DB_QUERY_FAILED', async () => {
      transactionTable.updateMany.mockRejectedValue(new Error('timeout'));

      const result = await repository.claimPaymentSubmission(started());

      expect(result._unsafeUnwrapErr().code).toBe('DB_QUERY_FAILED');
    });
  });

  describe('savePaymentResult', () => {
    const tx = {
      transaction: { updateMany: jest.fn() },
      delivery: { update: jest.fn() },
      product: { updateMany: jest.fn() },
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
      tx.product.updateMany.mockResolvedValue({ count: 1 });
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
      expect(tx.product.updateMany).not.toHaveBeenCalled();
    });

    it('con APPROVED liquida estado, entrega y descuenta el stock', async () => {
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
      expect(tx.product.updateMany).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      });
    });

    it('con DECLINED cancela la entrega y no toca el stock', async () => {
      await repositoryWithTx.savePaymentResult(settledWith('DECLINED'));

      expect(tx.delivery.update).toHaveBeenCalledWith({
        where: { transactionId: TRANSACTION_ID },
        data: { status: 'CANCELLED' },
      });
      expect(tx.product.updateMany).not.toHaveBeenCalled();
    });

    it('no hace nada más si otra petición ya la liquidó', async () => {
      tx.transaction.updateMany.mockResolvedValue({ count: 0 });

      const result = await repositoryWithTx.savePaymentResult(
        settledWith('APPROVED'),
      );

      expect(result.isOk()).toBe(true);
      expect(tx.delivery.update).not.toHaveBeenCalled();
      expect(tx.product.updateMany).not.toHaveBeenCalled();
    });

    it('registra una advertencia si se aprobó sin stock suficiente', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      tx.product.updateMany.mockResolvedValue({ count: 0 });

      const result = await repositoryWithTx.savePaymentResult(
        settledWith('APPROVED'),
      );

      expect(result.isOk()).toBe(true);
      expect(warn).toHaveBeenCalledWith(
        `Transaction ${TRANSACTION_ID} was approved without stock for product ${PRODUCT_ID}`,
      );
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
