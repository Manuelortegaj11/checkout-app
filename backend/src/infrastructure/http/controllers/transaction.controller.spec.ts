import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { TransactionOutput } from '@application/dtos/transaction/transaction.output';
import { CreateTransactionUseCase } from '@application/use-cases/transaction/create-transaction.use-case';
import { outOfStock, productNotFound } from '@domain/errors/product.errors';
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        { provide: CreateTransactionUseCase, useValue: createTransaction },
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
});
