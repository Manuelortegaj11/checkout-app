import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { TransactionOutput } from '@application/dtos/transaction/transaction.output';
import { CreateTransactionUseCase } from '@application/use-cases/transaction/create-transaction.use-case';
import { GetTransactionUseCase } from '@application/use-cases/transaction/get-transaction.use-case';
import { SubmitPaymentUseCase } from '@application/use-cases/transaction/submit-payment.use-case';
import { outOfStock, productNotFound } from '@domain/errors/product.errors';
import {
  paymentAlreadySubmitted,
  transactionNotFound,
} from '@domain/errors/transaction.errors';
import { paymentGatewayRejected } from '@infrastructure/payment-gateway/payment-gateway.errors';
import { errAsync, okAsync } from '@shared/result';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import { TRANSACTION_ID } from '@testing/fixtures/transaction.fixture';
import { configureApp } from '../configure-app';
import { TransactionController } from './transaction.controller';

const validBody = () => ({
  productId: PRODUCT_ID,
  quantity: 1,
  customer: {
    fullName: 'Ana Gómez',
    email: 'ana@example.com',
    phone: '3001234567',
  },
  delivery: {
    recipientName: 'Ana Gómez',
    phone: '3001234567',
    addressLine1: 'Calle 10 # 20-30',
    addressLine2: 'Apto 402',
    city: 'Medellín',
    region: 'Antioquia',
    postalCode: '050021',
  },
});

const transactionOutput = {
  id: TRANSACTION_ID,
  reference: 'TX-019200000000700080000000000000A1',
  status: 'PENDING',
  statusMessage: null,
  paymentSubmitted: false,
  quantity: 1,
} as unknown as TransactionOutput;

describe('TransactionController', () => {
  let app: NestExpressApplication;
  const createTransaction = { execute: jest.fn() };
  const submitPayment = { execute: jest.fn() };
  const getTransaction = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        { provide: CreateTransactionUseCase, useValue: createTransaction },
        { provide: SubmitPaymentUseCase, useValue: submitPayment },
        { provide: GetTransactionUseCase, useValue: getTransaction },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app, { corsOrigin: 'http://localhost:3000' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/transactions')
      .send(body as object);

  describe('POST /api/transactions', () => {
    it('responde 201 con la transacción creada', async () => {
      createTransaction.execute.mockReturnValue(okAsync(transactionOutput));

      await post(validBody()).expect(201, transactionOutput);
    });

    it('entrega al caso de uso los textos sin espacios sobrantes, el teléfono solo con dígitos y los opcionales vacíos como ausentes', async () => {
      createTransaction.execute.mockReturnValue(okAsync(transactionOutput));
      const body = validBody();

      await post({
        ...body,
        customer: {
          ...body.customer,
          email: '  ana@example.com  ',
          phone: '300 123 4567',
        },
        delivery: { ...body.delivery, city: ' Medellín ', addressLine2: '   ' },
      }).expect(201);

      const [input] = createTransaction.execute.mock.calls[0] as [
        ReturnType<typeof validBody>,
      ];
      expect(input.customer.email).toBe('ana@example.com');
      expect(input.customer.phone).toBe('3001234567');
      expect(input.delivery.city).toBe('Medellín');
      expect(input.delivery.addressLine2).toBeUndefined();
    });

    it('acepta la dirección sin los campos opcionales', async () => {
      createTransaction.execute.mockReturnValue(okAsync(transactionOutput));
      const { delivery } = validBody();
      const withoutOptionals: Partial<typeof delivery> = { ...delivery };
      delete withoutOptionals.addressLine2;
      delete withoutOptionals.postalCode;

      await post({ ...validBody(), delivery: withoutOptionals }).expect(201);
    });

    it.each([
      [
        'productId no es un UUID',
        { productId: 'abc' },
        [{ field: 'productId', message: 'productId must be a UUID' }],
      ],
      [
        'quantity supera el máximo por compra',
        { quantity: 11 },
        [
          {
            field: 'quantity',
            message: 'quantity must not be greater than 10',
          },
        ],
      ],
      [
        'quantity no es entero',
        { quantity: 1.5 },
        [{ field: 'quantity', message: 'quantity must be an integer number' }],
      ],
      [
        'falta el cliente',
        { customer: undefined },
        [
          {
            field: 'customer',
            message: 'customer should not be null or undefined',
          },
        ],
      ],
    ])('responde 400 si %s', async (_case, override, details) => {
      await post({ ...validBody(), ...override }).expect(400, {
        code: 'INVALID_REQUEST',
        message: 'Request validation failed',
        details,
      });
      expect(createTransaction.execute).not.toHaveBeenCalled();
    });

    it('responde 400 con la ruta completa de los campos anidados inválidos', async () => {
      const body = validBody();

      const response = await post({
        ...body,
        customer: { ...body.customer, fullName: '   ', email: 'ana@' },
        delivery: { ...body.delivery, phone: '300-123', addressLine1: 'x' },
      }).expect(400);

      expect(response.body).toMatchObject({
        code: 'INVALID_REQUEST',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'customer.fullName' }),
          { field: 'customer.email', message: 'email must be an email' },
          {
            field: 'delivery.phone',
            message: 'phone must contain 7 to 20 digits',
          },
          expect.objectContaining({ field: 'delivery.addressLine1' }),
        ]) as unknown,
      });
    });

    it('responde 400 si se envían montos: los calcula el backend', async () => {
      const response = await post({
        ...validBody(),
        totalInCents: 1,
      }).expect(400);

      expect(response.body).toMatchObject({
        details: [
          {
            field: 'totalInCents',
            message: 'property totalInCents should not exist',
          },
        ],
      });
    });

    it('responde 404 PRODUCT_NOT_FOUND si el producto no existe', async () => {
      createTransaction.execute.mockReturnValue(
        errAsync(productNotFound(PRODUCT_ID)),
      );

      await post(validBody()).expect(404, {
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${PRODUCT_ID} not found`,
      });
    });

    it('responde 409 OUT_OF_STOCK si no hay unidades suficientes', async () => {
      createTransaction.execute.mockReturnValue(
        errAsync(outOfStock(PRODUCT_ID, 2, 1)),
      );

      await post(validBody()).expect(409, {
        code: 'OUT_OF_STOCK',
        message: `Product ${PRODUCT_ID} has 1 units available, 2 requested`,
      });
    });
  });

  describe('POST /api/transactions/:id/payment', () => {
    const paymentBody = () => ({
      cardToken: 'tok_stagtest_5113_abc',
      installments: 1,
      acceptanceToken: 'end-user-policy-token',
      personalDataAuthToken: 'personal-data-auth-token',
    });
    const pay = (body: unknown, id = TRANSACTION_ID) =>
      request(app.getHttpServer())
        .post(`/api/transactions/${id}/payment`)
        .send(body as object);

    it('responde 200 con el resultado del cobro y entrega el id al caso de uso', async () => {
      const approved = { ...transactionOutput, status: 'APPROVED' };
      submitPayment.execute.mockReturnValue(okAsync(approved));

      await pay(paymentBody()).expect(200, approved);
      expect(submitPayment.execute).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
        ...paymentBody(),
      });
    });

    it('un pago rechazado responde 200 con status DECLINED, no es un error HTTP', async () => {
      const declined = {
        ...transactionOutput,
        status: 'DECLINED',
        statusMessage: 'La transacción fue rechazada (Sandbox)',
      };
      submitPayment.execute.mockReturnValue(okAsync(declined));

      await pay(paymentBody()).expect(200, declined);
    });

    it('rechaza el número de tarjeta: el backend nunca lo recibe', async () => {
      const response = await pay({
        ...paymentBody(),
        cardNumber: '4242424242424242',
      }).expect(400);

      expect(response.body).toMatchObject({
        details: [
          {
            field: 'cardNumber',
            message: 'property cardNumber should not exist',
          },
        ],
      });
      expect(submitPayment.execute).not.toHaveBeenCalled();
    });

    it.each([
      [
        'installments fuera de rango',
        { installments: 37 },
        'installments must not be greater than 36',
      ],
      [
        'falta el token de aceptación',
        { acceptanceToken: '' },
        'acceptanceToken should not be empty',
      ],
      [
        'el token de tarjeta está vacío',
        { cardToken: '   ' },
        'cardToken should not be empty',
      ],
    ])('responde 400 si %s', async (_case, override, message) => {
      const response = await pay({ ...paymentBody(), ...override }).expect(400);

      expect(response.body).toMatchObject({
        code: 'INVALID_REQUEST',
        details: expect.arrayContaining([
          expect.objectContaining({ message }),
        ]) as unknown,
      });
      expect(submitPayment.execute).not.toHaveBeenCalled();
    });

    it('responde 400 si el id no es un UUID', async () => {
      await pay(paymentBody(), 'abc').expect(400);
      expect(submitPayment.execute).not.toHaveBeenCalled();
    });

    it.each([
      [transactionNotFound(TRANSACTION_ID), 404],
      [paymentAlreadySubmitted(TRANSACTION_ID), 409],
      [paymentGatewayRejected({ status: 422 }), 502],
    ])('traduce %o a HTTP %i', async (error, status) => {
      submitPayment.execute.mockReturnValue(errAsync(error));

      await pay(paymentBody()).expect(status, {
        code: error.code,
        message: error.message,
      });
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('responde 200 con la transacción', async () => {
      getTransaction.execute.mockReturnValue(okAsync(transactionOutput));

      await request(app.getHttpServer())
        .get(`/api/transactions/${TRANSACTION_ID}`)
        .expect(200, transactionOutput);
      expect(getTransaction.execute).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
      });
    });

    it('responde 404 TRANSACTION_NOT_FOUND si no existe', async () => {
      getTransaction.execute.mockReturnValue(
        errAsync(transactionNotFound(TRANSACTION_ID)),
      );

      await request(app.getHttpServer())
        .get(`/api/transactions/${TRANSACTION_ID}`)
        .expect(404, {
          code: 'TRANSACTION_NOT_FOUND',
          message: `Transaction ${TRANSACTION_ID} not found`,
        });
    });

    it('responde 400 si el id no es un UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/transactions/abc')
        .expect(400);
      expect(getTransaction.execute).not.toHaveBeenCalled();
    });
  });
});
