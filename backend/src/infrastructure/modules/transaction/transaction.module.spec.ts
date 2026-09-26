import { ConfigModule, ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '@infrastructure/http/configure-app';
import { PrismaService } from '@infrastructure/persistence/prisma.service';
import { aCustomerRow } from '@testing/fixtures/customer-row.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import { aProductRow } from '@testing/fixtures/product-row.fixture';
import { aCreateTransactionInput } from '@testing/fixtures/transaction.fixture';
import { mockConfigService } from '@testing/mocks/config-service.mock';
import { PersistenceModule } from '../persistence/persistence.module';
import { TransactionModule } from './transaction.module';

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const EXISTING_CUSTOMER_ID = '01920000-0000-7000-8000-00000000cafe';

/**
 * Cableado real del contexto (controlador → caso de uso → repositorios de
 * productos, clientes y transacciones, tarifas, UUID v7 y reloj) con Prisma
 * y la configuración simulados.
 */
describe('TransactionModule', () => {
  let app: NestExpressApplication;
  const prisma = {
    product: { findUnique: jest.fn() },
    customer: { upsert: jest.fn() },
    transaction: { create: jest.fn() },
  };

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
});
