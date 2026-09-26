import { ConfigModule, ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '@infrastructure/http/configure-app';
import { anAcceptanceContracts } from '@testing/fixtures/checkout.fixture';
import {
  aMerchantResponse,
  jsonResponse,
} from '@testing/fixtures/merchant-response.fixture';
import { mockConfigService } from '@testing/mocks/config-service.mock';
import { CheckoutModule } from '@infrastructure/modules/checkout/checkout.module';

/**
 * Cableado real del contexto (controlador → caso de uso → adapters de tarifas
 * y pasarela) con la configuración fija y `fetch` simulado.
 */
describe('CheckoutModule', () => {
  let app: NestExpressApplication;
  let fetchMock: jest.SpyInstance;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        CheckoutModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(
        mockConfigService({
          BASE_FEE_IN_CENTS: 250_000,
          DELIVERY_FEE_IN_CENTS: 800_000,
          PAYMENT_GATEWAY_BASE_URL: 'https://gateway.test/v1',
          PAYMENT_GATEWAY_PUBLIC_KEY: 'pub_test_abc123',
          PAYMENT_GATEWAY_TIMEOUT_MS: 5_000,
        }),
      )
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app, { corsOrigin: 'http://localhost:3000' });
    await app.init();
  });

  beforeEach(() => {
    fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(aMerchantResponse()));
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/checkout/config recorre toda la cadena hasta la pasarela', async () => {
    await request(app.getHttpServer()).get('/api/checkout/config').expect(200, {
      currency: 'COP',
      baseFeeInCents: 250_000,
      deliveryFeeInCents: 800_000,
      acceptance: anAcceptanceContracts(),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://gateway.test/v1/merchants/pub_test_abc123',
      expect.any(Object),
    );
  });
});
