import { HttpStatus, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { CreateTransactionInput } from '@application/dtos/transaction/create-transaction.input';
import type { CreateTransactionUseCase } from '@application/use-cases/transaction/create-transaction.use-case';
import type { GetTransactionUseCase } from '@application/use-cases/transaction/get-transaction.use-case';
import type { SubmitPaymentUseCase } from '@application/use-cases/transaction/submit-payment.use-case';
import { outOfStock } from '@domain/errors/product.errors';
import { transactionNotFound } from '@domain/errors/transaction.errors';
import { paymentGatewayRejected } from '@infrastructure/payment-gateway/payment-gateway.errors';
import { errAsync, okAsync } from '@shared/result';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aCreateTransactionInput,
  aSubmitPaymentBody,
  aTransactionOutput,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { mockUseCase } from '@testing/mocks/use-case.mock';
import { TransactionController } from '@infrastructure/http/controllers/transaction.controller';
import { CreateTransactionRequest } from '@infrastructure/http/dtos/create-transaction.request';

/** La compra tal como el ValidationPipe se la entrega al controlador. */
const aCreateTransactionRequest = (
  overrides: Partial<CreateTransactionInput> = {},
): CreateTransactionRequest =>
  plainToInstance(CreateTransactionRequest, aCreateTransactionInput(overrides));

describe('TransactionController', () => {
  const createTransaction = mockUseCase<CreateTransactionUseCase>();
  const submitPayment = mockUseCase<SubmitPaymentUseCase>();
  const getTransaction = mockUseCase<GetTransactionUseCase>();
  const controller = new TransactionController(
    createTransaction,
    submitPayment,
    getTransaction,
  );

  describe('create', () => {
    it('entrega la compra al caso de uso y devuelve la transacción creada', async () => {
      const request = aCreateTransactionRequest();
      createTransaction.execute.mockReturnValue(okAsync(aTransactionOutput()));

      await expect(controller.create(request)).resolves.toEqual(
        aTransactionOutput(),
      );
      expect(createTransaction.execute).toHaveBeenCalledWith(request);
    });

    it('sale del riel con 409 OUT_OF_STOCK si no hay unidades suficientes', async () => {
      createTransaction.execute.mockReturnValue(
        errAsync(outOfStock(PRODUCT_ID, 2, 1)),
      );

      await expect(
        controller.create(aCreateTransactionRequest({ quantity: 2 })),
      ).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
        response: { code: 'OUT_OF_STOCK' },
      });
    });
  });

  describe('pay', () => {
    it('cobra la transacción de la ruta con los tokens del cuerpo', async () => {
      const approved = aTransactionOutput({ status: 'APPROVED' });
      submitPayment.execute.mockReturnValue(okAsync(approved));

      await expect(
        controller.pay(TRANSACTION_ID, aSubmitPaymentBody()),
      ).resolves.toEqual(approved);
      expect(submitPayment.execute).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
        ...aSubmitPaymentBody(),
      });
    });

    it('un pago rechazado viaja por el riel de éxito con status DECLINED', async () => {
      const declined = aTransactionOutput({
        status: 'DECLINED',
        statusMessage: 'Fondos insuficientes',
      });
      submitPayment.execute.mockReturnValue(okAsync(declined));

      await expect(
        controller.pay(TRANSACTION_ID, aSubmitPaymentBody()),
      ).resolves.toEqual(declined);
    });

    it('sale del riel con 502 PAYMENT_GATEWAY_REJECTED si la pasarela rechaza el cobro', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation();
      submitPayment.execute.mockReturnValue(
        errAsync(paymentGatewayRejected({ status: 422 })),
      );

      await expect(
        controller.pay(TRANSACTION_ID, aSubmitPaymentBody()),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
        response: { code: 'PAYMENT_GATEWAY_REJECTED' },
      });
    });
  });

  describe('get', () => {
    it('consulta la transacción por el id de la ruta', async () => {
      getTransaction.execute.mockReturnValue(okAsync(aTransactionOutput()));

      await expect(controller.get(TRANSACTION_ID)).resolves.toEqual(
        aTransactionOutput(),
      );
      expect(getTransaction.execute).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
      });
    });

    it('sale del riel con 404 TRANSACTION_NOT_FOUND si no existe', async () => {
      getTransaction.execute.mockReturnValue(
        errAsync(transactionNotFound(TRANSACTION_ID)),
      );

      await expect(controller.get(TRANSACTION_ID)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
        response: {
          code: 'TRANSACTION_NOT_FOUND',
          message: `Transaction ${TRANSACTION_ID} not found`,
        },
      });
    });
  });
});
