import { ConfigModule, ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '@infrastructure/http/configure-app';
import { PrismaService } from '@infrastructure/persistence/prisma.service';
import { aCustomerRow } from '@testing/fixtures/customer-row.fixture';
import { aGatewayTransactionResponse } from '@testing/fixtures/gateway-transaction.fixture';
import { jsonResponse } from '@testing/fixtures/merchant-response.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import { aProductRow } from '@testing/fixtures/product-row.fixture';
import { aTransactionViewRow } from '@testing/fixtures/transaction-row.fixture';
import {
  aCreateTransactionInput,
  anAwaitingTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { mockConfigService } from '@testing/mocks/config-service.mock';
import { PersistenceModule } from '../persistence/persistence.module';
import { TransactionModule } from './transaction.module';

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const EXISTING_CUSTOMER_ID = '01920000-0000-7000-8000-00000000cafe';

/**
 * Cableado real del contexto (controlador → caso de uso → repositorios de
 * productos, clientes y transacciones, pasarela, tarifas, UUID v7 y reloj) con
 * Prisma, la configuración y `fetch` simulados.
 */
describe('TransactionModule', () => {
  let app: NestExpressApplication;
  const tx = {
    transaction: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    delivery: { update: jest.fn() },
    product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
  const prisma = {
    product: { findUnique: jest.fn() },
    customer: { upsert: jest.fn() },
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((work: (client: typeof tx) => Promise<void>) =>
      work(tx),
    ),
  };
  let fetchMock: jest.SpyInstance;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PersistenceModule,
        TransactionModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(ConfigService)
      .useValue(
        mockConfigService({
          BASE_FEE_IN_CENTS: 250_000,
          DELIVERY_FEE_IN_CENTS: 800_000,
          PAYMENT_GATEWAY_BASE_URL: 'https://gateway.test/v1',
          PAYMENT_GATEWAY_PUBLIC_KEY: 'pub_test_abc123',
          PAYMENT_GATEWAY_INTEGRITY_SECRET: 'test_integrity_0123456789abcdef',
          PAYMENT_GATEWAY_TIMEOUT_MS: 5_000,
          PAYMENT_GATEWAY_POLL_TIMEOUT_MS: 3,
          PAYMENT_GATEWAY_POLL_INTERVAL_MS: 1,
        }),
      )
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app, { corsOrigin: 'http://localhost:3000' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/transactions recorre toda la cadena hasta la persistencia', async () => {
    prisma.product.findUnique.mockResolvedValue(aProductRow());
    prisma.customer.upsert.mockResolvedValue(
      aCustomerRow({ id: EXISTING_CUSTOMER_ID }),
    );
    prisma.transaction.create.mockResolvedValue({ id: 'ignored' });

    const response = await request(app.getHttpServer())
      .post('/api/transactions')
      .send(aCreateTransactionInput())
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.stringMatching(UUID_V7) as unknown,
      status: 'PENDING',
      paymentSubmitted: false,
      amounts: { totalInCents: 20_040_000 },
    });
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: PRODUCT_ID,
        customerId: EXISTING_CUSTOMER_ID,
        delivery: {
          create: expect.objectContaining({
            status: 'PENDING_PAYMENT',
          }) as unknown,
        },
      }) as unknown,
      select: { id: true },
    });
  });

  describe('pago y consulta', () => {
    const approvedResponse = () =>
      jsonResponse(aGatewayTransactionResponse({ status: 'APPROVED' }), 201);

    beforeEach(() => {
      fetchMock = jest.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
      fetchMock.mockRestore();
    });

    it('POST /api/transactions/:id/payment cobra en la pasarela y liquida en la base de datos', async () => {
      prisma.transaction.findUnique.mockResolvedValue(aTransactionViewRow());
      prisma.transaction.updateMany.mockResolvedValue({ count: 1 });
      fetchMock.mockResolvedValue(approvedResponse());

      const response = await request(app.getHttpServer())
        .post(`/api/transactions/${TRANSACTION_ID}/payment`)
        .send({
          cardToken: 'tok_stagtest_5113_abc',
          installments: 1,
          acceptanceToken: 'end-user-policy-token',
          personalDataAuthToken: 'personal-data-auth-token',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'APPROVED',
        delivery: { status: 'ASSIGNED' },
      });
      expect(fetchMock).toHaveBeenCalledWith(
        'https://gateway.test/v1/transactions',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(tx.product.updateMany).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      });
    });

    it('GET /api/transactions/:id sincroniza un cobro pendiente con la pasarela', async () => {
      prisma.transaction.findUnique.mockResolvedValue(
        aTransactionViewRow(anAwaitingTransaction()),
      );
      fetchMock.mockResolvedValue(
        jsonResponse(aGatewayTransactionResponse({ status: 'DECLINED' })),
      );

      const response = await request(app.getHttpServer())
        .get(`/api/transactions/${TRANSACTION_ID}`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'DECLINED',
        delivery: { status: 'CANCELLED' },
      });
      expect(tx.delivery.update).toHaveBeenCalledWith({
        where: { transactionId: TRANSACTION_ID },
        data: { status: 'CANCELLED' },
      });
    });
  });
});
